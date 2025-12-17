import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { token, email, password }: ResetPasswordRequest = await req.json();

    // Input validation
    if (!token || typeof token !== 'string' || token.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 72) {
      return new Response(JSON.stringify({ error: "Password must be between 6 and 72 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit check
    const rateLimitResult = await checkRateLimit(serviceClient, email, "reset_password", 5, 15);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Too many attempts. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash the provided token
    const tokenHash = await hashToken(token);

    // Find user by email
    const { data: users } = await serviceClient.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token or email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find valid token
    const { data: tokenRecord, error: tokenError } = await serviceClient
      .from("auth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("token_hash", tokenHash)
      .eq("token_type", "reset")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !tokenRecord) {
      console.log("Token validation failed:", tokenError);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user password
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(JSON.stringify({ error: "Failed to reset password" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark token as used
    await serviceClient
      .from("auth_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id);

    // Sign out any existing sessions for this user
    await serviceClient.auth.admin.signOut(user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password reset successfully. Please sign in with your new password." 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in admin-reset-password:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
async function checkRateLimit(
  client: any,
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  const { data: existing } = await client
    .from("rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .eq("action", action)
    .single();

  if (!existing) {
    await client.from("rate_limits").insert({
      identifier,
      action,
      attempt_count: 1,
      window_start: new Date().toISOString(),
    });
    return { allowed: true };
  }

  if (new Date(existing.window_start) < new Date(windowStart)) {
    await client
      .from("rate_limits")
      .update({ attempt_count: 1, window_start: new Date().toISOString() })
      .eq("id", existing.id);
    return { allowed: true };
  }

  if (existing.attempt_count >= maxAttempts) {
    return { allowed: false };
  }

  await client
    .from("rate_limits")
    .update({ attempt_count: existing.attempt_count + 1 })
    .eq("id", existing.id);
  
  return { allowed: true };
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get requesting user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: requestingUser }, error: userError } = await anonClient.auth.getUser();
    
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if requesting user is admin or owner
    const { data: requestingRole } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    const isAdminOrOwner = requestingRole?.role === "admin" || requestingRole?.role === "owner";
    if (!isAdminOrOwner) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all users
    const { data: users, error: usersError } = await serviceClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all roles
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("user_id, role");

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    // Map users with roles
    const userList = users?.users?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      role: roleMap.get(user.id) || "user",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      invited: user.user_metadata?.invited || false,
      password_set: user.user_metadata?.password_set || !user.user_metadata?.invited,
    })) || [];

    return new Response(JSON.stringify({ users: userList }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in admin-get-users:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

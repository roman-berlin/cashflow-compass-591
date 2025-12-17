import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header from the request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify their identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin or owner
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (!roleData || !["admin", "owner"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent deleting yourself
    if (userId === requestingUser.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if target user is owner (cannot delete owner)
    const { data: targetRoleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (targetRoleData?.role === "owner") {
      return new Response(JSON.stringify({ error: "Cannot delete owner account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only owner can delete admins
    if (targetRoleData?.role === "admin" && roleData.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owner can delete admin users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Deleting user ${userId} by ${requestingUser.email}`);

    // Delete user's data from related tables first
    await serviceClient.from("user_roles").delete().eq("user_id", userId);
    await serviceClient.from("settings").delete().eq("user_id", userId);
    await serviceClient.from("ammo_state").delete().eq("user_id", userId);
    await serviceClient.from("market_state").delete().eq("user_id", userId);
    await serviceClient.from("notifications").delete().eq("user_id", userId);
    await serviceClient.from("recommendations_log").delete().eq("user_id", userId);
    await serviceClient.from("auth_tokens").delete().eq("user_id", userId);
    
    // Delete contributions and snapshots
    const { data: snapshots } = await serviceClient
      .from("portfolio_snapshots")
      .select("id")
      .eq("user_id", userId);
    
    if (snapshots && snapshots.length > 0) {
      const snapshotIds = snapshots.map(s => s.id);
      await serviceClient.from("contributions").delete().in("snapshot_id", snapshotIds);
    }
    await serviceClient.from("contributions").delete().eq("user_id", userId);
    await serviceClient.from("portfolio_snapshots").delete().eq("user_id", userId);

    // Delete the user from auth
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      throw deleteError;
    }

    console.log(`User ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in admin-delete-user:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete user" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

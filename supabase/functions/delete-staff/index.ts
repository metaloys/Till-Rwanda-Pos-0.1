import { createClient } from 'npm:@supabase/supabase-js@^2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userIdToDelete } = await req.json();
    if (!userIdToDelete) {
      throw new Error("User ID to delete is missing.");
    }

    // Initialize Supabase Admin client with the Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // This admin command deletes the user from the Authentication system.
    // Because we set up "ON DELETE CASCADE" on the profiles table,
    // deleting the auth user will automatically delete their profile row.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: "User deleted successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
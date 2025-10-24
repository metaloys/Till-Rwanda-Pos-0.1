import { createClient } from 'npm:@supabase/supabase-js@^2.0';

interface Payload {
  userId: string;
  activate: boolean; // true = activate, false = deactivate
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, activate } = await req.json() as Payload;
    if (!userId) {
      throw new Error("User ID is missing.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Update the user's profile status
    const updateData = {
      status: activate ? 'active' : 'deactivated',
      deactivated_at: activate ? null : new Date().toISOString()
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Step 2: If deactivating, force the user to sign out
    if (!activate) {
      // --- FIX: Use the correct admin function 'signOutUser' ---
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOutUser(userId);
      // --- END FIX ---
      
      if (signOutError) {
        // Don't fail the whole request, just log a warning
        console.warn(`Could not force sign out for user ${userId}: ${signOutError.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, newStatus: updateData.status }), {
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
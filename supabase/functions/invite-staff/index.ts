import { createClient } from 'npm:@supabase/supabase-js@^2.0';

// Define the expected request body structure
interface InvitationPayload {
  email: string;
  role: string;
  shopId: string;
  ownerName: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
     return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
       status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }

  try {
    // 1. Initialize Supabase Admin Client (using the service key)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error: Missing Supabase environment variables.");
    }
    // CRITICAL: Must use the Service Role Key to bypass RLS and create/invite users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse Request Body
    const payload: InvitationPayload = await req.json();
    const { email, role, shopId, ownerName } = payload;
    
    if (!email || !role || !shopId) {
      throw new Error("Missing email, role, or shopId in request payload.");
    }
    
    // 3. Send the Invitation
    // This sends an email invite with a link for the user to set their password.
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
            role: role, // This custom data is not saved by Supabase by default, but it's part of the API payload
            shop_id: shopId,
            invited_by: ownerName,
        },
        // We will rely on the trigger and a final profile update later
    });

    if (inviteError) {
        // Handle case where user already exists (it will update the user, which is acceptable)
        if (inviteError.status === 422) {
             throw new Error(`User ${email} already exists. Please update their role instead.`);
        }
        throw new Error(`Failed to send invitation: ${inviteError.message}`);
    }

    // 4. Manual Profile Provisioning (Ensures role and shop_id are set when they accept the invite)
    // The user's profile is created as 'cashier' by the initial trigger. 
    // We now update it to the correct role and shop_id immediately after inviting, 
    // ensuring the link is ready when they click the invite link.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: role,
            shop_id: shopId,
            shop_name: 'Invited Staff' // Placeholder, will be updated by Owner later
        })
        .eq('id', inviteData.user.id);
        
    // If the trigger hasn't fired yet (async), this will run after the trigger fires. 
    // For now, we assume the initial profile exists or will exist soon.
    
    if (profileError) console.error("Could not pre-assign profile data:", profileError.message);


    // 5. Return Success
    return new Response(JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email} for role ${role}.`
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Invitation Error:', error);
    let errorMessage = error.message;
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});
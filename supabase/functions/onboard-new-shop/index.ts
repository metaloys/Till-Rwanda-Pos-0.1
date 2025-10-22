import { createClient } from 'npm:@supabase/supabase-js@^2.0';
import { v4 as uuidv4 } from 'npm:uuid@^9'; 

interface OnboardingPayload {
  userId: string;
  shopName: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS and POST method checks
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server configuration error.");
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload: OnboardingPayload = await req.json();
    const { userId, shopName } = payload;
    
    if (!userId || !shopName) { throw new Error("Missing userId or shopName."); }
    
    // --- SIMPLIFIED SHOP CREATION ---
    // We are NOT providing is_active or trial_ends_at.
    // We are relying on the database's "DEFAULT" values for those columns.
    // This bypasses the API schema cache error.
    const newShopId = uuidv4();
    const { error: shopError } = await supabaseAdmin
      .from('shops')
      .insert({ 
          id: newShopId, 
          owner_id: userId, 
          name: shopName,
      });
    // --- END SIMPLIFIED CREATION ---

    if (shopError) throw new Error(`Failed to create shop record: ${shopError.message}`);

    // Update the user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
          shop_id: newShopId, 
          role: 'owner',
          shop_name: shopName 
      })
      .eq('id', userId);

    if (profileError) console.error("Could not update user profile (non-critical):", profileError.message);

    // Return Success
    return new Response(JSON.stringify({ 
        success: true, 
        shopId: newShopId, 
        message: 'Shop successfully provisioned.' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Onboarding Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});
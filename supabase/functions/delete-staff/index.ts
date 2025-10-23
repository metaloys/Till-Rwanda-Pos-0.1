import { createClient } from 'npm:@supabase/supabase-js@^2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log("--- Delete Staff function invoked ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Step 1: Parsing request body...");
    const { userIdToDelete } = await req.json();
    if (!userIdToDelete) {
      throw new Error("User ID to delete is missing.");
    }
    console.log("Step 2: User ID found:", userIdToDelete);

    console.log("Step 3: Initializing Admin Client...");
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("Step 4: Admin Client initialized.");

    // --- NEW STEP: Find and delete user's files ---
    console.log("Step 5: Searching for user's files in storage...");
    
    // Find all files owned by this user in the 'receipts' bucket
    const { data: receipts, error: receiptsError } = await supabaseAdmin.storage
      .from('receipts')
      .list('', { search: `owner:${userIdToDelete}` }); // This search might not be perfect, an alternative is a folder path
      
    if (receiptsError) console.error("Could not list receipts:", receiptsError.message);

    // Find all files owned by this user in the 'product-images' bucket
    const { data: images, error: imagesError } = await supabaseAdmin.storage
      .from('product-images')
      .list('', { search: `owner:${userIdToDelete}` }); // This search might not be perfect

    if (imagesError) console.error("Could not list product images:", imagesError.message);

    // --- If files are found, delete them ---
    if (receipts && receipts.length > 0) {
        const receiptPaths = receipts.map(file => file.name);
        console.log(`Deleting ${receiptPaths.length} receipts...`);
        const { error: deleteReceiptError } = await supabaseAdmin.storage
            .from('receipts')
            .remove(receiptPaths);
        if (deleteReceiptError) console.warn("Error deleting receipts:", deleteReceiptError.message);
    }
    
    if (images && images.length > 0) {
        const imagePaths = images.map(file => file.name);
        console.log(`Deleting ${imagePaths.length} product images...`);
        const { error: deleteImageError } = await supabaseAdmin.storage
            .from('product-images')
            .remove(imagePaths);
        if (deleteImageError) console.warn("Error deleting images:", deleteImageError.message);
    }
    console.log("Step 6: File cleanup complete.");
    // --- END NEW STEP ---

    console.log("Step 7: Attempting to delete user from Auth...");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);
    console.log("Step 8: deleteUser call completed.");

    if (error) {
      console.error("Step 9a: Error received from deleteUser:", error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
    
    console.log("Step 9b: User deleted successfully.");
    return new Response(JSON.stringify({ success: true, message: "User deleted successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("--- FATAL ERROR in delete-staff function ---");
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Loading generate-qr-code function...");

serve(async (req) => {
  // This is a PREFLIGHT request. We need to handle it gracefully.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Get the data from the app
    const { order_id, amount } = await req.json();

    if (!order_id || !amount) {
      throw new Error("Missing order_id or amount");
    }

    // 2. Get your secret key
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!FLUTTERWAVE_SECRET_KEY) {
      throw new Error("FLUTTERWAVE_SECRET_KEY is not set in env");
    }
    
    // 3. Create the unique transaction reference
    const tx_ref = `TILL_RWANDA_QR_${order_id}_${Date.now()}`; // Add timestamp for uniqueness

    console.log(`Generating QR for tx_ref: ${tx_ref} with amount: ${amount}`);

    // 4. Securely call Flutterwave to generate a QR code
    // This is a different charge type
    const response = await fetch("https://api.flutterwave.com/v3/charges?type=qr", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: tx_ref,
        amount: amount,
        currency: "RWF",
        email: `customer-${order_id}@tillrwanda.com`, // Dummy email
        fullname: "Till Rwanda Customer",
        redirect_url: "https://tillrwanda.com/payment-success", // Placeholder
        // We're asking for a QR code specifically
        payment_options: "qr", 
      }),
    });

    const data = await response.json();

    // 5. Handle the response
    if (data.status === "success" && data.meta && data.meta.authorization) {
      // The API returns the QR code as a string
      const qrCodeString = data.meta.authorization.qr;
      
      console.log(`Successfully generated QR for tx_ref: ${tx_ref}`);

      return new Response(
        JSON.stringify({ 
          status: "success",
          qr_code_string: qrCodeString,
          tx_ref: tx_ref // Send the tx_ref back to the app
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.error("Flutterwave QR Error:", data);
      throw new Error(data.message || "Failed to generate QR code from Flutterwave");
    }
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
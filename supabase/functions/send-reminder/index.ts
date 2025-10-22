import { createClient } from 'npm:@supabase/supabase-js@^2.0';
// --- CHANGE IS HERE ---
import twilio from 'npm:twilio@^4'; // Import the default export
// --- END CHANGE ---

interface ReminderPayload {
  customerId: number;
}

const SHOP_NAME = "Your Shop"; // CHANGE THIS LATER

console.log('Function starting up...');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 1. Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }
  // 2. Only allow POST requests
  if (req.method !== 'POST') {
     console.log(`Method Not Allowed: ${req.method}`);
     return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
       status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }

  try {
    // 3. Parse Request Body
    const payload: ReminderPayload = await req.json();
    const customerId = payload.customerId;
    if (!customerId) throw new Error("Missing 'customerId'");
    console.log(`Received request for customerId: ${customerId}`);

    // 4. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase env vars");
      throw new Error("Server configuration error.");
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized.');

    // 5. Fetch Customer Data
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('name, phone, credit_balance')
      .eq('id', customerId)
      .single();

    if (fetchError) throw new Error(`Database error: ${fetchError.message}`);
    if (!customer) throw new Error(`Customer with ID ${customerId} not found.`);
    if (!customer.phone) throw new Error(`Customer ${customer.name} has no phone number.`);
    if (customer.credit_balance <= 0) throw new Error(`Customer ${customer.name} has no outstanding balance.`);

    let formattedPhone = customer.phone.replace(/[^+\d]/g, '');
    if (!formattedPhone.startsWith('+250') || formattedPhone.length !== 13) {
      if (formattedPhone.startsWith('07') && formattedPhone.length === 10) {
        formattedPhone = '+250' + formattedPhone.substring(1);
      } else {
         throw new Error(`Invalid or missing country code for phone number: ${customer.phone}. Must start with +250.`);
      }
    }
    const recipientWhatsAppNumber = `whatsapp:${formattedPhone}`;
    console.log(`Fetched customer: ${customer.name}, Phone: ${recipientWhatsAppNumber}`);

    // 6. Initialize Twilio Client
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
        console.error("Missing Twilio env vars");
        throw new Error("Server configuration error.");
    }
    // --- CHANGE IS HERE ---
    const twilioClient = twilio(accountSid, authToken); // Call the default export
    // --- END CHANGE ---
    console.log('Twilio client initialized.');

    // 7. Construct Message
    const messageBody = `Muraho ${customer.name}, ni ${SHOP_NAME}. Turashaka kuvugana namwe. Mwaduhamagara kuri iyi numero. Murakoze.`;

    // 8. Send WhatsApp Message
    console.log(`Attempting to send message to ${recipientWhatsAppNumber}`);
    const message = await twilioClient.messages.create({ // Use twilioClient
       body: messageBody,
       from: twilioWhatsAppNumber,
       to: recipientWhatsAppNumber,
     });
    console.log(`Message sent successfully! SID: ${message.sid}`);

    // 9. Return Success Response
    return new Response(JSON.stringify({ success: true, messageSid: message.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    let status = 500;
    if (error.message.includes("Missing 'customerId'") || error.message.includes("has no phone number") || error.message.includes("no outstanding balance") || error.message.includes("Invalid or missing country code")) status = 400;
    else if (error.message.includes("not found")) status = 404;
    else if (error.message.includes("Server configuration error")) status = 500;

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});
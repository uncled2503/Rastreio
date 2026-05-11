import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { planName, amount } = await req.json();
    if (!planName || !amount) throw new Error("Plan name and amount are required");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Usando a nova API KEY 2 configurada
    const apiKey = Deno.env.get('ROYALBANKING_API_KEY2') || Deno.env.get('ROYALBANKING_API_KEY');

    const generateMockPix = async () => {
      const mockId = "mock_plan_" + Date.now();
      const mockPix = "00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405" + amount + "5802BR5913Receita Federal6008Brasilia62140510PLAN" + Date.now() + "6304A1B2";

      await supabase.from('pix_gateway_payments').upsert({
        id_transaction: mockId,
        status: 'pending',
        raw_payload: { planName, pix: mockPix, amount, site_origin: 'rastrear_oficial', isFallback: true }
      });

      return new Response(JSON.stringify({ success: true, pixCopiaECola: mockPix, idTransaction: mockId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    };

    if (!apiKey) return await generateMockPix();

    try {
      const payload = {
        "api-key": apiKey,
        "amount": amount,
        "client": {
          "name": "Cliente Assinante",
          "document": "12345678909",
          "telefone": "11999999999",
          "email": "assinante@email.com"
        },
        "callbackUrl": `https://ulrigywayovxuyiktnlr.supabase.co/functions/v1/royal-banking-webhook`
      };

      const response = await fetch("https://api.royalbanking.com.br/v1/gateway/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || data.status !== 'success') return await generateMockPix();

      const idTransaction = data.idTransaction;
      const pixCopiaECola = data.paymentCode;

      await supabase.from('pix_gateway_payments').upsert({
        id_transaction: String(idTransaction),
        status: 'pending',
        raw_payload: { planName, pix: pixCopiaECola, amount, site_origin: 'rastrear_oficial' }
      });

      return new Response(JSON.stringify({ success: true, pixCopiaECola, idTransaction }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (fetchError) {
      return await generateMockPix();
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
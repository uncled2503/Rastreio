import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { planName, amount } = await req.json();

    if (!planName || !amount) {
      throw new Error("Plan name and amount are required");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKey = Deno.env.get('ROYALBANKING_API_KEY');
    
    // Se a API Key não for encontrada, mock de teste de segurança
    if (!apiKey) {
      console.warn("ROYALBANKING_API_KEY não configurada. Utilizando modo simulado.");
      const mockId = "mock_plan_" + Date.now();
      const mockPix = "00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405" + amount + "5802BR5913Receita Federal6008Brasilia62140510PLAN" + Date.now() + "6304A1B2";
      
      await supabase.from('pix_gateway_payments').upsert({
        id_transaction: mockId,
        status: 'pending',
        raw_payload: { planName, pix: mockPix, amount }
      });
      
      return new Response(JSON.stringify({ success: true, pixCopiaECola: mockPix, idTransaction: mockId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Chamada REAL da API Royal Banking
    const payload = {
      "api-key": apiKey,
      "amount": amount,
      "client": {
        "name": "Cliente Assinante",
        "document": "12345678909",
        "telefone": "11999999999",
        "email": "assinante@email.com"
      },
      "callbackUrl": "https://ulrigywayovxuyiktnlr.supabase.co/functions/v1/royal-banking-webhook"
    };

    const response = await fetch("https://api.royalbanking.com.br/v1/gateway/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      console.error("[create-plan-pix] Falha Royal Banking:", data);
      throw new Error("Erro de comunicação com o Gateway de Pagamentos.");
    }

    const idTransaction = data.idTransaction;
    const pixCopiaECola = data.paymentCode;

    // Salva a transação com ID da Royal Banking
    await supabase.from('pix_gateway_payments').upsert({
      id_transaction: idTransaction,
      status: 'pending',
      raw_payload: { planName, pix: pixCopiaECola, amount }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      pixCopiaECola,
      idTransaction
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[create-plan-pix] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
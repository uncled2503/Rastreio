import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  console.log("[royal-banking-webhook] Recebendo notificação...");

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  // Resposta exigida pela Royal Banking: json_encode(200) que resulta na string "200"
  const okResponse = new Response("200", {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    const body = await req.json();
    console.log("[royal-banking-webhook] Payload:", JSON.stringify(body));

    // A documentação cita idTransaction no JSON mas externalReference na tabela de campos.
    // Vamos capturar ambos para não ter erro.
    const transactionId = body.idTransaction || body.externalReference || body.id;
    const status = String(body.status || '').toLowerCase();

    console.log(`[royal-banking-webhook] ID: ${transactionId} | Status: ${status}`);

    // Status de sucesso: "paid" (cash in) ou "SaquePago" (cash out)
    const isPaid = status === 'paid' || status === 'saquepago' || status === 'approved';

    if (transactionId && isPaid) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log(`[royal-banking-webhook] Confirmando pagamento para: ${transactionId}`);

      const { error } = await supabase
        .from('pix_gateway_payments')
        .update({ status: 'paid' }) // Mudamos para "paid" para bater com o check-pix-status
        .eq('id_transaction', String(transactionId));

      if (error) {
        console.error("[royal-banking-webhook] Erro ao atualizar banco:", error);
      } else {
        console.log("[royal-banking-webhook] Pagamento processado com sucesso.");
      }
    }

    return okResponse;
  } catch (err) {
    console.error("[royal-banking-webhook] Erro ao processar webhook:", err);
    // Mesmo em erro, retornamos 200 para evitar que eles fiquem reenviando se o problema for no nosso código
    return okResponse;
  }
})
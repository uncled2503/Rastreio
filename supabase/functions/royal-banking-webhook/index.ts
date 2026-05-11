import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  console.log("[royal-banking-webhook] Recebendo requisição...");

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

  const defaultResponse = new Response(JSON.stringify({ status: 200, message: "OK" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    const bodyText = await req.text();
    console.log("[royal-banking-webhook] Payload recebido:", bodyText);

    if (!bodyText) return defaultResponse;

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error("[royal-banking-webhook] Erro de JSON:", e);
      return defaultResponse;
    }

    // Suporte robusto para múltiplas estruturas e case-insensitivity
    const transactionId = body.idTransaction || body.externalReference || body.id || (body.data && body.data.idTransaction);
    const rawStatus = body.status || (body.data && body.data.status) || '';
    
    // Transforma PAID, Approved, etc em tudo minúsculo para garantir a validação
    const status = String(rawStatus).toLowerCase();

    console.log(`[royal-banking-webhook] ID Extraído: ${transactionId} | Status Extraído: ${status}`);

    // Status que indicam que o pagamento foi um sucesso no Gateway
    const successStatuses = ['paid', 'approved', 'success', 'concluded', 'pago', 'aproved'];

    if (transactionId && successStatuses.includes(status)) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log(`[royal-banking-webhook] Atualizando transação ${transactionId} para approved...`);

      const { data, error } = await supabase
        .from('pix_gateway_payments')
        .update({ status: 'approved' })
        .eq('id_transaction', String(transactionId))
        .select();

      if (error) {
        console.error("[royal-banking-webhook] Erro ao atualizar BD:", error);
      } else {
        console.log("[royal-banking-webhook] Sucesso! Linhas afetadas:", data?.length);
      }
    } else {
      console.log("[royal-banking-webhook] Ignorado. ID Ausente ou Status não aprovado.");
    }

    return defaultResponse;
  } catch (err) {
    console.error("[royal-banking-webhook] Erro fatal:", err);
    return defaultResponse;
  }
})
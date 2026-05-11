import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  // RESPOSTA PADRÃO DA ROYAL BANKING (String "200")
  const okResponse = new Response("200", {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  if (req.method === 'OPTIONS') return okResponse;

  try {
    const body = await req.json();
    console.log("[royal-banking-webhook] Recebido:", JSON.stringify(body));

    const transactionId = String(body.idTransaction || body.externalReference || body.id || '');
    const status = String(body.status || '').toLowerCase();

    // Verificação de status paga (aceita várias nomenclaturas do mercado)
    const isPaid = ['paid', 'saquepago', 'approved', 'sucesso', 'completed'].includes(status);

    if (transactionId && isPaid) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Atualiza o status no banco para 'paid'
      const { error } = await supabase
        .from('pix_gateway_payments')
        .update({ status: 'paid' })
        .eq('id_transaction', transactionId);

      if (error) {
        console.error(`[royal-banking-webhook] Erro ao atualizar transação ${transactionId}:`, error);
      } else {
        console.log(`[royal-banking-webhook] Transação ${transactionId} marcada como PAGA.`);
      }
    }

    return okResponse;
  } catch (err) {
    console.error("[royal-banking-webhook] Erro crítico:", err);
    return okResponse;
  }
})
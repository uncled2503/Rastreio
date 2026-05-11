import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  // A documentação exige retorno imediato de HTTP 200 com json_encode(200)
  const okResponse = new Response("200", {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  if (req.method === 'OPTIONS') return okResponse;

  try {
    const body = await req.json();
    console.log("[royal-banking-webhook] Payload recebido:", JSON.stringify(body));

    // A documentação menciona idTransaction e externalReference
    const transactionId = String(body.idTransaction || body.externalReference || '');
    const status = String(body.status || '');

    if (transactionId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Mapeamento de status conforme documentação:
      // paid -> Cash In Pago
      // SaquePago -> Cash Out Pago
      // SaqueFalhou -> Cash Out Falhou
      
      let finalStatus = 'pending';
      if (status === 'paid' || status === 'SaquePago') {
        finalStatus = 'paid';
      } else if (status === 'SaqueFalhou') {
        finalStatus = 'failed';
      }

      if (finalStatus !== 'pending') {
        const { error } = await supabase
          .from('pix_gateway_payments')
          .update({ 
            status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id_transaction', transactionId);

        if (error) {
          console.error(`[royal-banking-webhook] Erro ao atualizar BD para ${transactionId}:`, error);
        } else {
          console.log(`[royal-banking-webhook] Transação ${transactionId} atualizada para: ${finalStatus}`);
        }
      }
    }

    return okResponse;
  } catch (err) {
    console.error("[royal-banking-webhook] Erro no processamento:", err);
    // Mesmo em erro, retornamos 200 para evitar retentativas infinitas se for erro de lógica
    return okResponse;
  }
})
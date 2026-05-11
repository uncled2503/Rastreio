import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // A documentação do Royal Banking costuma exigir o retorno do texto "200"
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    console.log("[royal-banking-webhook] Payload recebido:", JSON.stringify(body));

    // Extração flexível do ID da transação
    // O gateway pode enviar em 'idTransaction', 'externalReference' ou 'reference'
    const transactionId = String(body.idTransaction || body.externalReference || body.reference || '');
    const status = String(body.status || '').toLowerCase();

    console.log(`[royal-banking-webhook] Processando Transação: ${transactionId} | Status: ${status}`);

    if (transactionId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Mapeamento de status expandido
      // paid, approved, success -> Sucesso
      // failed, canceled, error -> Falha
      
      let finalStatus = 'pending';
      if (['paid', 'approved', 'success', 'saquepago'].includes(status)) {
        finalStatus = 'paid';
      } else if (['failed', 'canceled', 'error', 'saquefalhou'].includes(status)) {
        finalStatus = 'failed';
      }

      if (finalStatus !== 'pending') {
        const { data, error } = await supabase
          .from('pix_gateway_payments')
          .update({ 
            status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id_transaction', transactionId)
          .select();

        if (error) {
          console.error(`[royal-banking-webhook] Erro ao atualizar banco para ID ${transactionId}:`, error);
        } else if (data && data.length > 0) {
          console.log(`[royal-banking-webhook] Transação ${transactionId} atualizada com sucesso para: ${finalStatus}`);
        } else {
          console.warn(`[royal-banking-webhook] Transação ${transactionId} não encontrada no banco para atualizar.`);
        }
      }
    } else {
      console.error("[royal-banking-webhook] ID da transação não encontrado no payload.");
    }

    // Retorno padrão exigido pelo gateway
    return new Response("200", {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("[royal-banking-webhook] Erro crítico no processamento:", err);
    // Retornamos 200 mesmo em erro para o gateway parar de tentar, mas logamos o erro
    return new Response("200", {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
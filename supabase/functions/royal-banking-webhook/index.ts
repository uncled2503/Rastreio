import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Resposta padrão para pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    console.log("[royal-banking-webhook] Webhook recebido:", JSON.stringify(payload));

    // A documentação cita idTransaction no JSON mas externalReference no texto.
    // Verificamos ambos para garantir a captura do ID único.
    const transactionId = String(payload.idTransaction || payload.externalReference || '');
    const status = String(payload.status || '');

    if (transactionId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Mapeamento baseado no resumo de estados da documentação:
      // Cash In Pago: 'paid'
      // Cash Out Pago: 'SaquePago'
      // Cash Out Falhou: 'SaqueFalhou'
      
      let finalStatus = 'pending';
      
      if (status === 'paid' || status === 'SaquePago') {
        finalStatus = 'paid';
      } else if (status === 'SaqueFalhou') {
        finalStatus = 'failed';
      }

      if (finalStatus !== 'pending') {
        console.log(`[royal-banking-webhook] Atualizando transação ${transactionId} para ${finalStatus}`);
        
        const { error } = await supabase
          .from('pix_gateway_payments')
          .update({ 
            status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id_transaction', transactionId);

        if (error) {
          console.error(`[royal-banking-webhook] Erro ao atualizar DB:`, error);
        }
      }
    } else {
      console.warn("[royal-banking-webhook] ID da transação não identificado no payload.");
    }

    // A documentação exige retorno HTTP 200 com o corpo json_encode(200)
    // Em Deno/TS, JSON.stringify(200) resulta na string "200"
    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });

  } catch (err) {
    console.error("[royal-banking-webhook] Erro crítico:", err.message);
    // Mesmo em erro de processamento interno, respondemos 200 para evitar retentativas infinitas do gateway se o payload for inválido
    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Resposta para pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    console.log("[royal-banking-webhook] Payload recebido:", JSON.stringify(payload));

    // A documentação diz que pode vir idTransaction ou externalReference
    const transactionId = String(payload.idTransaction || payload.externalReference || '');
    const status = String(payload.status || '');

    if (!transactionId) {
      console.error("[royal-banking-webhook] ID da transação não encontrado no payload.");
      // Respondemos 200 mesmo assim para evitar retentativas infinitas do gateway se o payload estiver malformado
      return new Response(JSON.stringify(200), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mapeamento de Estados (Conforme documentação):
    // Cash In Pago: 'paid'
    // Cash Out Pago: 'SaquePago'
    // Cash Out Falhou: 'SaqueFalhou'
    
    let dbStatus = 'pending';
    if (status === 'paid' || status === 'SaquePago') {
      dbStatus = 'paid';
    } else if (status === 'SaqueFalhou') {
      dbStatus = 'failed';
    }

    if (dbStatus !== 'pending') {
      console.log(`[royal-banking-webhook] Atualizando transação ${transactionId} para status: ${dbStatus}`);
      
      const { error } = await supabase
        .from('pix_gateway_payments')
        .update({ 
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id_transaction', transactionId);

      if (error) {
        console.error(`[royal-banking-webhook] Erro ao atualizar banco de dados:`, error);
      } else {
        console.log(`[royal-banking-webhook] Transação ${transactionId} atualizada com sucesso.`);
      }
    }

    // A documentação EXIGE: retorne HTTP 200 com json_encode(200)
    // Em Deno/JS, JSON.stringify(200) gera exatamente o corpo "200"
    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });

  } catch (err) {
    console.error("[royal-banking-webhook] Erro crítico processando webhook:", err.message);
    // Respondemos 200 para cessar as tentativas do gateway em caso de erro de código
    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
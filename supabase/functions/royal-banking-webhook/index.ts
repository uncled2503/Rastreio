import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    console.log("[royal-banking-webhook] Payload recebido:", JSON.stringify(payload));

    const transactionId = String(payload.idTransaction || payload.externalReference || payload.id || '');
    const status = String(payload.status || '').toLowerCase();

    if (!transactionId) {
      console.error("[royal-banking-webhook] ID da transação não encontrado.");
      return new Response(JSON.stringify(200), { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mapeamento estendido de status de sucesso
    const successStatuses = ['paid', 'saquepago', 'approved', 'success', 'completed', 'pago'];
    const failureStatuses = ['failed', 'saquefalhou', 'canceled', 'rejected'];
    
    let dbStatus = 'pending';
    if (successStatuses.includes(status)) {
      dbStatus = 'paid';
    } else if (failureStatuses.includes(status)) {
      dbStatus = 'failed';
    }

    if (dbStatus !== 'pending') {
      console.log(`[royal-banking-webhook] Atualizando transação ${transactionId} para: ${dbStatus}`);
      
      const { error } = await supabase
        .from('pix_gateway_payments')
        .update({ 
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id_transaction', transactionId);

      if (error) {
        console.error(`[royal-banking-webhook] Erro no banco:`, error);
      }
    }

    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("[royal-banking-webhook] Erro crítico:", err.message);
    return new Response(JSON.stringify(200), { status: 200, headers: corsHeaders });
  }
})
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Verificação por ID de Transação (usado no Modal)
    if (body.transactionId) {
      console.log(`[check-pix-status] Verificando status da transação: ${body.transactionId}`);
      const { data, error } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .eq('id_transaction', String(body.transactionId))
        .maybeSingle();

      if (error) {
        console.error("[check-pix-status] Erro ao buscar status:", error);
        return new Response(JSON.stringify({ status: 'error', message: error.message }), { status: 200, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ status: data?.status || 'pending' }), { headers: corsHeaders });
    }

    // Verificação por Código de Rastreio (usado na Timeline)
    if (body.trackingCode) {
      console.log(`[check-pix-status] Contando pagamentos pagos para o rastreio: ${body.trackingCode}`);
      // Busca pagamentos que contenham o trackingCode no payload jsonb
      const { data, error } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .contains('raw_payload', { trackingCode: body.trackingCode });

      if (error) {
        console.error("[check-pix-status] Erro ao contar pagamentos:", error);
        return new Response(JSON.stringify({ paymentsCount: 0 }), { headers: corsHeaders });
      }

      const paymentsCount = data?.filter(p => p.status === 'paid').length || 0;
      return new Response(JSON.stringify({ paymentsCount }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Parâmetros ausentes" }), { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error("[check-pix-status] Erro interno:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
})
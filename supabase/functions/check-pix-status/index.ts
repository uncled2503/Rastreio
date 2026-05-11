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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Verificação por ID de Transação (polling do Modal)
    if (body.transactionId) {
      const { data } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .eq('id_transaction', String(body.transactionId))
        .maybeSingle();

      const status = data?.status?.toLowerCase() || 'pending';
      const isPaid = ['paid', 'approved', 'saquepago'].includes(status);

      return new Response(JSON.stringify({ status: isPaid ? 'paid' : status }), { headers: corsHeaders });
    }

    // 2. Verificação por Código de Rastreio (timeline)
    if (body.trackingCode) {
      const { data } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .contains('raw_payload', { trackingCode: body.trackingCode });
        
      const taxaPaga = data?.some(p => {
        const s = String(p.status || '').toLowerCase();
        return ['paid', 'approved', 'saquepago'].includes(s);
      }) ?? false;
      
      return new Response(JSON.stringify({ taxaPaga }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Parâmetros ausentes" }), { headers: corsHeaders, status: 400 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
})
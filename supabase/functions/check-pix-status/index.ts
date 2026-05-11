import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (body.transactionId) {
      const { data } = await supabase
        .from('pix_gateway_payments')
        .select('status, created_at')
        .eq('id_transaction', body.transactionId)
        .maybeSingle();

      if (data) {
        // Auto-aprovação para Mocks
        const isMock = String(body.transactionId).startsWith('mock_');
        const secondsSinceCreation = (new Date().getTime() - new Date(data.created_at).getTime()) / 1000;

        if (isMock && data.status === 'pending' && secondsSinceCreation > 5) {
          await supabase.from('pix_gateway_payments').update({ status: 'paid' }).eq('id_transaction', body.transactionId);
          return new Response(JSON.stringify({ status: 'paid' }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ status: data.status }), { headers: corsHeaders });
      }
    }

    if (body.trackingCode) {
      // Busca rigorosa no JSONB
      const { data } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .contains('raw_payload', { trackingCode: body.trackingCode });
        
      const taxaPaga = data?.some(p => p.status === 'paid' || p.status === 'approved') ?? false;
      
      return new Response(JSON.stringify({ taxaPaga }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Missing parameters" }), { headers: corsHeaders, status: 400 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
})
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

    // Consulta para o Polling do Modal
    if (body.transactionId) {
      const { data, error } = await supabase
        .from('pix_gateway_payments')
        .select('status, created_at')
        .eq('id_transaction', body.transactionId)
        .maybeSingle();

      if (data) {
        // LÓGICA DE AUTO-APROVAÇÃO PARA MOCK (Testes)
        // Se for um mock e tiver passado mais de 5 segundos, aprovamos automaticamente
        const isMock = String(body.transactionId).startsWith('mock_');
        const secondsSinceCreation = (new Date().getTime() - new Date(data.created_at).getTime()) / 1000;

        if (isMock && data.status === 'pending' && secondsSinceCreation > 5) {
          console.log(`[check-pix-status] Auto-aprovando mock: ${body.transactionId}`);
          await supabase
            .from('pix_gateway_payments')
            .update({ status: 'approved' })
            .eq('id_transaction', body.transactionId);
          
          return new Response(JSON.stringify({ status: 'approved' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ status: data.status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Consulta para a Busca de Rastreio (Verifica se qualquer transação deste código foi paga)
    if (body.trackingCode) {
      const { data } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .contains('raw_payload', { trackingCode: body.trackingCode });
        
      const taxaPaga = data?.some(p => p.status === 'approved' || p.status === 'paid') ?? false;
      
      return new Response(JSON.stringify({ taxaPaga }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error: any) {
    console.error("[check-pix-status] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
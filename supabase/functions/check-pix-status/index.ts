import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    if (body.transactionId) {
      const { data } = await supabase.from('pix_gateway_payments').select('status').eq('id_transaction', String(body.transactionId)).maybeSingle();
      return new Response(JSON.stringify({ status: data?.status || 'pending' }), { headers: corsHeaders });
    }

    if (body.trackingCode) {
      const { data, error } = await supabase.from('pix_gateway_payments').select('status, raw_payload').filter('raw_payload->>trackingCode', 'eq', body.trackingCode);
      if (error) throw error;
        
      const checkPaid = (amount: number) => data?.some(p => 
        (p.status === 'approved' || p.status === 'paid') && 
        Math.abs((p.raw_payload as any).amount - amount) < 0.1
      ) ?? false;
      
      return new Response(JSON.stringify({ 
        taxa1590: checkPaid(15.90),
        taxa990: checkPaid(9.90)
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Missing parameters" }), { headers: corsHeaders, status: 400 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
})
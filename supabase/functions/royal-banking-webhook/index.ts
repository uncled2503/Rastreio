import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  // O Webhook deve SEMPRE retornar status 200 com JSON contendo 200 (como pede a documentação)
  const defaultResponse = new Response("200", {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    const bodyText = await req.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return defaultResponse; // Impede retentativas infinitas da Royal Banking
    }

    // Aceita tanto idTransaction quanto externalReference baseando-se nos 2 cenários da Doc
    const transactionId = body.idTransaction || body.externalReference;
    const status = body.status;

    if (transactionId && (status === 'paid' || status === 'approved')) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Atualiza nossa tabela para "approved" confirmando o pagamento
      await supabase
        .from('pix_gateway_payments')
        .update({ status: 'approved' })
        .eq('id_transaction', transactionId);
    }

    return defaultResponse;
  } catch (err) {
    console.error("[royal-banking-webhook] Error processing webhook:", err);
    return defaultResponse;
  }
})
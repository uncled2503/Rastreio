import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  const url = new URL(req.url);
  const originParam = url.searchParams.get('origin');

  // RESPOSTA PADRÃO DA ROYAL BANKING (String "200")
  const okResponse = new Response("200", {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  if (req.method === 'OPTIONS') return okResponse;

  // FILTRO DE SEGURANÇA: Só processa se a URL de callback tiver o nosso identificador
  if (originParam !== 'rastrear_oficial') {
    console.warn("[royal-banking-webhook] Ignorando requisição de origem desconhecida ou outro site.");
    return okResponse; // Retorna 200 para a gateway parar de tentar, mas não faz nada
  }

  try {
    const body = await req.json();
    const transactionId = String(body.idTransaction || body.externalReference || body.id || '');
    const status = String(body.status || '').toLowerCase();

    // Status de sucesso: "paid", "SaquePago" ou "approved"
    const isPaid = status === 'paid' || status === 'saquepago' || status === 'approved';

    if (transactionId && isPaid) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Validação adicional no Banco: Verifica se o registro local também pertence a este site
      const { data: existing } = await supabase
        .from('pix_gateway_payments')
        .select('raw_payload')
        .eq('id_transaction', transactionId)
        .maybeSingle();

      if (existing && existing.raw_payload?.site_origin === 'rastrear_oficial') {
        console.log(`[royal-banking-webhook] Confirmando pagamento exclusivo RastreAR: ${transactionId}`);
        await supabase
          .from('pix_gateway_payments')
          .update({ status: 'paid' })
          .eq('id_transaction', transactionId);
      } else {
        console.warn(`[royal-banking-webhook] Transação ${transactionId} não encontrada ou não pertence a este contexto.`);
      }
    }

    return okResponse;
  } catch (err) {
    console.error("[royal-banking-webhook] Erro crítico:", err);
    return okResponse;
  }
})
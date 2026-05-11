export type TrackingEvent = {
  id: string;
  date: string;
  status: string;
  location: string;
  destination?: string;
  icon: "package" | "truck" | "check" | "alert" | "shield";
  done: boolean;
  isTaxEvent?: boolean;
  taxAmount?: number;
};

export function generateTimeline(
  code: string, 
  destCity: string, 
  destState: string, 
  destBairro: string, 
  startDateIso: string, 
  paymentsCount: number = 0
): TrackingEvent[] {
  const start = new Date(startDateIso);
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const events: TrackingEvent[] = [];
  const destStr = destState ? `${destCity} / ${destState}` : destCity;
  
  // Customização para os códigos de teste de 1 Real
  const isOneRealTest = code === 'BR1REAL111BR' || code === 'BR9999X999BR';
  const firstTaxAmount = isOneRealTest ? 1.00 : 19.90;
  
  // --- BLOCO 1: INÍCIO ATÉ O 7º DIA ---
  events.push({ id: "ev0", date: start.toISOString(), status: "Objeto postado", location: "Agência dos Correios - São Paulo / SP", icon: "package", done: true });
  events.push({ id: "ev1", date: addDays(start, 2).toISOString(), status: "Objeto encaminhado", location: "CTE São Paulo / SP", destination: "CTE Curitiba / PR", icon: "truck", done: true });
  events.push({ id: "ev2", date: addDays(start, 4).toISOString(), status: "Objeto chegou na unidade de tratamento", location: "CTE Curitiba / PR", icon: "truck", done: true });
  events.push({ id: "ev3", date: addDays(start, 6).toISOString(), status: "Objeto encaminhado para fiscalização aduaneira", location: "CTE Curitiba / PR", icon: "truck", done: true });

  // TAXA 1 - 7º DIA
  const tax1Paid = paymentsCount >= 1;
  events.push({ 
    id: "tax1", 
    date: addDays(start, 7).toISOString(), 
    status: tax1Paid ? "Pagamento confirmado: Despacho Postal liberado" : "Aguardando pagamento: Objeto retido para Despacho Postal", 
    location: "Centro de Fiscalização - Curitiba / PR", 
    icon: tax1Paid ? "shield" : "alert", 
    done: true,
    isTaxEvent: !tax1Paid,
    taxAmount: firstTaxAmount
  });

  // --- BLOCO 2: DO PAGAMENTO 1 ATÉ O 10º DIA ---
  if (tax1Paid) {
    events.push({ id: "ev4", date: addDays(start, 8).toISOString(), status: "Objeto liberado pela alfândega", location: "CTE Curitiba / PR", icon: "check", done: true });
    events.push({ id: "ev5", date: addDays(start, 9).toISOString(), status: "Objeto encaminhado", location: "CTE Curitiba / PR", destination: `Unidade de Distribuição - ${destStr}`, icon: "truck", done: true });
    
    // TAXA 2 - 10º DIA
    const tax2Paid = paymentsCount >= 2;
    events.push({ id: "ev6", date: addDays(start, 10).toISOString(), status: "Objeto chegou na unidade de destino", location: `Unidade de Distribuição - ${destStr}`, icon: "truck", done: true });
    
    events.push({ 
      id: "tax2", 
      date: addDays(start, 10).toISOString(), 
      status: tax2Paid ? "Taxa de Manuseio Logístico confirmada" : "Ação Necessária: Taxa de Manuseio Logístico pendente", 
      location: `CDD ${destStr}`, 
      icon: tax2Paid ? "shield" : "alert", 
      done: true,
      isTaxEvent: !tax2Paid,
      taxAmount: 9.90
    });

    // --- BLOCO 3: FINALIZAÇÃO APÓS PAGAMENTO 2 ---
    if (tax2Paid) {
      const finalDate = addDays(start, 10);
      finalDate.setHours(finalDate.getHours() + 4);
      events.push({ id: "ev7", date: finalDate.toISOString(), status: "Objeto saiu para entrega ao destinatário", location: `CDD ${destBairro || 'Centro'} - ${destStr}`, icon: "truck", done: true });
      
      finalDate.setHours(finalDate.getHours() + 2);
      events.push({ id: "ev8", date: finalDate.toISOString(), status: "Objeto entregue", location: destStr, icon: "check", done: true });
    }
  }

  return events.reverse();
}
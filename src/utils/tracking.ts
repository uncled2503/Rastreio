export type TrackingEvent = {
  id: string;
  date: string;
  status: string;
  location: string;
  destination?: string;
  icon: "package" | "truck" | "check" | "alert" | "shield";
  done: boolean;
  amount?: number;
};

const CIDADES = ["Curitiba", "Joinville", "Londrina", "Maringá", "Blumenau", "Campinas", "Santos"];

export function generateTimeline(code: string, destCity: string, destState: string, destBairro: string, startDateIso: string, taxa1990: boolean = false, taxa990: boolean = false): TrackingEvent[] {
  const now = new Date();
  const start = new Date(startDateIso);
  const addDays = (date: Date, d: number, h: number) => {
    const res = new Date(date);
    res.setDate(res.getDate() + d);
    res.setHours(res.getHours() + h);
    return res;
  };

  const destStr = destState ? `${destCity} / ${destState}` : destCity;
  const events: TrackingEvent[] = [];
  
  // Eventos Iniciais
  events.push({ id: "ev0", date: start.toISOString(), status: "Objeto postado", location: "ACF Central - São Paulo / SP", icon: "package", done: true });

  let currentDate = addDays(start, 1, 4);
  events.push({ id: "ev1", date: currentDate.toISOString(), status: "Objeto encaminhado para unidade de tratamento", location: "CTE São Paulo / SP", icon: "truck", done: true });

  // PRIMEIRA TAXA (19,90)
  currentDate = addDays(currentDate, 2, 2);
  events.push({ 
    id: "ev_tax1", 
    date: currentDate.toISOString(), 
    status: taxa1990 ? "Pagamento confirmado: Objeto liberado pela fiscalização" : "Aguardando pagamento: Objeto retido na fiscalização aduaneira", 
    location: "Centro de Logística Internacional - Curitiba / PR", 
    icon: taxa1990 ? "shield" : "alert", 
    done: true,
    amount: 19.90
  });

  if (!taxa1990) return events.reverse();

  // Continua após Taxa 1
  currentDate = addDays(currentDate, 1, 5);
  events.push({ id: "ev2", date: currentDate.toISOString(), status: "Objeto encaminhado para cidade de destino", location: "CTE Curitiba / PR", destination: destStr, icon: "truck", done: true });

  currentDate = addDays(currentDate, 1, 2);
  events.push({ id: "ev3", date: currentDate.toISOString(), status: "Objeto chegou na unidade de distribuição", location: `CDD ${destStr}`, icon: "truck", done: true });

  // SEGUNDA TAXA (9,90) - Inventada
  currentDate = addDays(currentDate, 0, 1);
  events.push({ 
    id: "ev_tax2", 
    date: currentDate.toISOString(), 
    status: taxa990 ? "Seguro de entrega local confirmado" : "Aguardando pagamento: Taxa de Seguro de Entrega Prioritária", 
    location: `Unidade de Distribuição - ${destStr}`, 
    icon: taxa990 ? "shield" : "alert", 
    done: true,
    amount: 9.90
  });

  if (!taxa990) return events.reverse();

  // Finalização após Taxa 2
  currentDate = addDays(currentDate, 0, 4);
  events.push({ id: "ev4", date: currentDate.toISOString(), status: "Objeto saiu para entrega ao destinatário", location: destStr, icon: "truck", done: true });

  currentDate = addDays(currentDate, 0, 2);
  events.push({ id: "ev5", date: currentDate.toISOString(), status: "Objeto entregue ao destinatário", location: destStr, icon: "check", done: true });

  return events.reverse();
}
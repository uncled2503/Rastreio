export type TrackingEvent = {
  id: string;
  date: string;
  status: string;
  location: string;
  destination?: string;
  icon: "package" | "truck" | "check" | "alert" | "shield";
  done: boolean;
};

const CIDADES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília", "Salvador", "Fortaleza", "Recife", "Curitiba", "Porto Alegre", "Goiânia",
  "Belém", "Manaus", "São Luís", "Maceió", "Natal", "João Pessoa", "Aracaju", "Teresina", "Campo Grande", "Cuiabá",
  "Palmas", "Rio Branco", "Macapá", "Boa Vista", "Vitória", "Florianópolis", "Campinas", "Santos", "Ribeirão Preto", "Uberlândia",
  "Contagem", "Juiz de Fora", "Londrina", "Maringá", "Joinville", "Caxias do Sul", "Pelotas", "Feira de Santana", "Caruaru", "Petrolina"
];

const FRANQUIAS = [
  "Expresso Correios", "Rápido Centro", "Postal Brasil", "Minas Express", "Log Express",
  "Envio Fácil", "Entrega Já", "Prime Correios", "Brasil Encomendas", "Fácil Post"
];

const BAIRROS = [
  "Centro", "Centro Histórico", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste",
  "Industrial", "Distrito Industrial", "Vila Nova", "Jardim América", "Jardim Europa",
  "Bela Vista", "Boa Vista", "Copacabana", "Ipanema", "Barra da Tijuca", "Savassi"
];

export function generateTimeline(code: string, destCity: string, destState: string, destBairro: string, startDateIso: string, taxaPaga: boolean = false): TrackingEvent[] {
  const now = new Date();

  // ============================================================================
  // MODO DE TESTE FIXO PARA OS CÓDIGOS DE TESTE
  // ============================================================================
  if (code === 'BR1212H271BR' || code === 'BR8888T888BR') {
    const getBusinessDate = (date: Date) => {
      const d = new Date(date);
      if (d.getDay() === 6) d.setDate(d.getDate() - 1); 
      if (d.getDay() === 0) d.setDate(d.getDate() - 2); 
      return d;
    };

    const base = getBusinessDate(new Date());

    const d = (daysAgo: number) => {
      let date = new Date(base);
      let count = 0;
      while (count < daysAgo) {
        date.setDate(date.getDate() - 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) count++;
      }
      date.setHours(9 + (count % 8), 15 + (count % 40)); 
      return date.toISOString();
    };

    const mockEvents: TrackingEvent[] = [
      { id: 'ev0', date: d(10), status: "Código de rastreio cadastrado, aguardando postagem", location: "ACF Expresso - São Paulo / SP", icon: "package", done: true },
      { id: 'ev1', date: d(9), status: "Objeto postado", location: "ACF Expresso - São Paulo / SP", icon: "package", done: true },
      { id: 'ev2', date: d(8), status: "Objeto encaminhado", location: "ACF Expresso - São Paulo / SP", destination: "CTE São Paulo - São Paulo / SP", icon: "truck", done: true },
      { id: 'ev3', date: d(5), status: "Objeto chegou na unidade", location: "CTE São Paulo - São Paulo / SP", icon: "truck", done: true },
      { id: 'ev4', date: d(4), status: "Objeto encaminhado", location: "CTE São Paulo - São Paulo / SP", destination: "CTE Curitiba / PR", icon: "truck", done: true },
      { id: 'ev5', date: d(2), status: "Objeto chegou na unidade", location: "CTE Curitiba / PR", icon: "truck", done: true },
      { 
        id: 'ev_tax', 
        date: taxaPaga ? new Date().toISOString() : d(1), 
        status: taxaPaga ? "Pagamento confirmado: Objeto liberado pela fiscalização aduaneira" : "Aguardando pagamento: Objeto retido na fiscalização aduaneira", 
        location: "Centro de Fiscalização - Curitiba / PR", 
        icon: taxaPaga ? "shield" : "alert", 
        done: true 
      },
    ];

    if (taxaPaga) {
      const confirmDate = new Date();
      confirmDate.setMinutes(confirmDate.getMinutes() - 1);
      
      mockEvents.push({ 
        id: 'ev_tax_paid', 
        date: confirmDate.toISOString(), 
        status: "Objeto encaminhado para entrega", 
        location: "Unidade de Tratamento - Curitiba / PR", 
        destination: `CDD ${destCity} / ${destState}`, 
        icon: "check", 
        done: true 
      });
    }

    return mockEvents.filter(e => e.done).reverse();
  }
  // ============================================================================

  let seedValue = 0;
  for (let i = 0; i < code.length; i++) {
    seedValue = (Math.imul(31, seedValue) + code.charCodeAt(i)) | 0;
  }
  
  const rnd = () => {
    seedValue = (seedValue + 0x6D2B79F5) | 0;
    let t = Math.imul(seedValue ^ (seedValue >>> 15), 1 | seedValue);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296);
  };

  const start = new Date(startDateIso);
  const city1 = CIDADES[Math.floor(rnd() * CIDADES.length)];
  const franquia = FRANQUIAS[Math.floor(rnd() * FRANQUIAS.length)];
  const bairroRef = destBairro || BAIRROS[Math.floor(rnd() * BAIRROS.length)];

  const addDays = (date: Date, days: number, hours: number) => {
    const d = new Date(date);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    d.setHours(d.getHours() + hours);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d;
  };

  const destStr = destState ? `${destCity} / ${destState}` : destCity;
  const events: TrackingEvent[] = [];
  
  events.push({ id: "ev0", date: start.toISOString(), status: "Código de rastreio cadastrado, aguardando postagem", location: `ACF ${franquia} - São Paulo / SP`, icon: "package", done: true });

  let currentDate = new Date(start);
  currentDate = addDays(currentDate, 1, 2);
  events.push({ id: "ev1", date: currentDate.toISOString(), status: "Objeto postado", location: `ACF ${franquia} - São Paulo / SP`, icon: "package", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 4);
  events.push({ id: "ev2", date: currentDate.toISOString(), status: "Objeto encaminhado", location: `ACF ${franquia} - São Paulo / SP`, destination: `CTE São Paulo - São Paulo / SP`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 8);
  events.push({ id: "ev3", date: currentDate.toISOString(), status: "Objeto chegou na unidade", location: `CTE São Paulo - São Paulo / SP`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 1, 2);
  events.push({ id: "ev4", date: currentDate.toISOString(), status: "Objeto encaminhado", location: `CTE São Paulo - São Paulo / SP`, destination: `CTE ${city1}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 1, 6);
  events.push({ id: "ev5", date: currentDate.toISOString(), status: "Objeto chegou na unidade", location: `CTE ${city1}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 4);
  const taxDate = new Date(taxaPaga ? now.getTime() - 60000 : currentDate.getTime());
  
  events.push({ 
    id: "ev_tax", 
    date: taxDate.toISOString(), 
    status: taxaPaga ? "Pagamento confirmado: Objeto liberado pela fiscalização aduaneira" : "Aguardando pagamento: Objeto retido na fiscalização aduaneira", 
    location: `Centro de Fiscalização - ${city1}`, 
    icon: taxaPaga ? "shield" : "alert", 
    done: true 
  });

  if (!taxaPaga) {
    return events.filter(e => e.done).reverse();
  }

  // Se a taxa foi paga, forçamos a exibição dos eventos de liberação como concluídos (done: true)
  const libDate = new Date(taxDate.getTime() + 300000); // 5 min depois
  events.push({ 
    id: "ev_tax_paid", 
    date: libDate.toISOString(), 
    status: "Objeto encaminhado para entrega", 
    location: `Unidade de Tratamento - ${city1}`, 
    destination: `CDD ${destStr}`, 
    icon: "check", 
    done: true 
  });

  currentDate = addDays(libDate, 1, 2);
  events.push({ id: "ev6", date: currentDate.toISOString(), status: "Objeto encaminhado", location: `CTE ${city1}`, destination: `CDD ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 1, 4);
  events.push({ id: "ev7", date: currentDate.toISOString(), status: "Objeto chegou na unidade", location: `CDD ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 2);
  events.push({ id: "ev8", date: currentDate.toISOString(), status: "Objeto saiu para entrega ao destinatário", location: `CDD ${bairroRef} - ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 4);
  events.push({ id: "ev9", date: currentDate.toISOString(), status: "Objeto entregue ao destinatário", location: `${destStr}`, icon: "check", done: currentDate <= now });

  return events.filter(e => e.done).reverse();
}
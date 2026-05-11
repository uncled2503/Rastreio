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
  // MODO DE TESTE FIXO
  if (code === 'BR1212H271BR' || code === 'BR8888T888BR' || code === 'BR00000001BR' || code === 'BR9999K999BR' || code === 'BR1111S111BR') {
    const getBusinessDate = (date: Date) => {
      const d = new Date(date);
      if (d.getDay() === 6) d.setDate(d.getDate() - 1);
      if (d.getDay() === 0) d.setDate(d.getDate() - 2);
      return d;
    };

    const base = getBusinessDate(new Date());
    const d = (daysAgo: number) => {
      let date = new Date(base);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    };

    const mockEvents: TrackingEvent[] = [
      { id: 'ev0', date: d(10), status: "Código de rastreio cadastrado, aguardando postagem", location: "ACF Expresso - São Paulo / SP", icon: "package", done: true },
      { id: 'ev1', date: d(9), status: "Objeto postado", location: "ACF Expresso - São Paulo / SP", icon: "package", done: true },
      { id: 'ev2', date: d(8), status: "Objeto encaminhado", location: "ACF Expresso - São Paulo / SP", destination: "CTE São Paulo - São Paulo / SP", icon: "truck", done: true },
      { id: 'ev3', date: d(5), status: "Objeto chegou na unidade", location: "CTE São Paulo - São Paulo / SP", icon: "truck", done: true },
      { id: 'ev4', date: d(4), status: "Objeto encaminhado", location: "CTE São Paulo - São Paulo / SP", destination: "CTE Curitiba / PR", icon: "truck", done: true },
      { id: 'ev5', date: d(2), status: "Objeto chegou na unidade", location: "CTE Curitiba / PR", icon: "truck", done: true },
      { id: 'ev_tax', date: taxaPaga ? new Date().toISOString() : d(1), status: taxaPaga ? "Pagamento confirmado: Objeto liberado pela fiscalização aduaneira" : "Aguardando pagamento: Objeto retido na fiscalização aduaneira", location: "Centro de Fiscalização - Curitiba / PR", icon: taxaPaga ? "shield" : "alert", done: true },
    ];

    if (taxaPaga) {
      const now = new Date();
      mockEvents.push({ id: 'ev_tax_paid', date: now.toISOString(), status: "Objeto encaminhado para entrega", location: "Unidade de Tratamento - Curitiba / PR", destination: `CDD ${destCity} / ${destState}`, icon: "check", done: true });
    }

    return mockEvents.filter(e => e.done).reverse();
  }

  // LÓGICA DINÂMICA PARA LEADS REAIS
  let seedValue = 0;
  for (let i = 0; i < code.length; i++) seedValue = (Math.imul(31, seedValue) + code.charCodeAt(i)) | <dyad-write path="src/utils/tracking.ts" description="Continuando a implementação da lógica dinâmica de geração de timeline.">
  seedValue = (Math.imul(31, seedValue) + code.charCodeAt(i)) | 0;
  
  const rnd = () => {
    seedValue = (seedValue + 0x6D2B79F5) | 0;
    let t = Math.imul(seedValue ^ (seedValue >>> 15), 1 | seedValue);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296);
  };

  const start = new Date(startDateIso);
  const now = new Date();
  const city1 = CIDADES[Math.floor(rnd() * CIDADES.length)];
  const franquia = FRANQUIAS[Math.floor(rnd() * FRANQUIAS.length)];
  const bairro = destBairro || BAIRROS[Math.floor(rnd() * BAIRROS.length)];

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const destStr = destState ? `${destCity} / ${destState}` : destCity;
  const events: TrackingEvent[] = [];
  
  let current = new Date(start);
  events.push({ id: "ev0", date: current.toISOString(), status: "Código de rastreio cadastrado, aguardando postagem", location: `ACF ${franquia} - São Paulo / SP`, icon: "package", done: true });

  current = addDays(current, 1);
  events.push({ id: "ev1", date: current.toISOString(), status: "Objeto postado", location: `ACF ${franquia} - São Paulo / SP`, icon: "package", done: current <= now });

  current = addDays(current, 1);
  events.push({ id: "ev2", date: current.toISOString(), status: "Objeto encaminhado", location: `ACF ${franquia} - São Paulo / SP`, destination: `CTE São Paulo - São Paulo / SP`, icon: "truck", done: current <= now });

  current = addDays(current, 2);
  events.push({ id: "ev3", date: current.toISOString(), status: "Objeto chegou na unidade", location: `CTE São Paulo - São Paulo / SP`, icon: "truck", done: current <= now });

  current = addDays(current, 1);
  events.push({ id: "ev4", date: current.toISOString(), status: "Objeto encaminhado", location: `CTE São Paulo - São Paulo / SP`, destination: `CTE ${city1}`, icon: "truck", done: current <= now });

  current = addDays(current, 2);
  events.push({ id: "ev5", date: current.toISOString(), status: "Objeto chegou na unidade", location: `CTE ${city1}`, icon: "truck", done: current <= now });

  current = addDays(current, 1);
  
  const taxDate = taxaPaga ? new Date() : current;
  events.push({ 
    id: "ev_tax", 
    date: taxDate.toISOString(), 
    status: taxaPaga ? "Pagamento confirmado: Objeto liberado pela fiscalização aduaneira" : "Aguardando pagamento: Objeto retido na fiscalização aduaneira", 
    location: `Centro de Fiscalização - ${city1}`, 
    icon: taxaPaga ? "shield" : "alert", 
    done: true 
  });

  if (taxaPaga) {
    const after = new Date(taxDate);
    events.push({ id: "ev_tax_paid", date: after.toISOString(), status: "Objeto encaminhado para entrega", location: `Unidade de Tratamento - ${city1}`, destination: `CDD ${destStr}`, icon: "check", done: true });
    
    after.setHours(after.getHours() + 2);
    events.push({ id: "ev6", date: after.toISOString(), status: "Objeto encaminhado", location: `CTE ${city1}`, destination: `CDD ${destStr}`, icon: "truck", done: true });

    after.setHours(after.getHours() + 4);
    events.push({ id: "ev7", date: after.toISOString(), status: "Objeto chegou na unidade", location: `CDD ${destStr}`, icon: "truck", done: true });

    after.setHours(after.getHours() + 2);
    events.push({ id: "ev8", date: after.toISOString(), status: "Objeto saiu para entrega ao destinatário", location: `CDD ${bairro} - ${destStr}`, icon: "truck", done: true });

    after.setHours(after.getHours() + 2);
    events.push({ id: "ev9", date: after.toISOString(), status: "Objeto entregue ao destinatário", location: `${destStr}`, icon: "check", done: true });
  }

  return events.filter(e => e.done).reverse();
}
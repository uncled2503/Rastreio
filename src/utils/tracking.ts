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
  // ============================================================================
  // MODO DE TESTE FIXO PARA OS CÓDIGOS DE TESTE
  // ============================================================================
  if (code === 'BR1212H271BR' || code === 'BR8888T888BR') {
    // Pegar o momento atual, mas garantir que não é fds e está em horário comercial
    const getBusinessDate = (date: Date) => {
      const d = new Date(date);
      if (d.getDay() === 6) d.setDate(d.getDate() - 1); // Sábado -> Sexta
      if (d.getDay() === 0) d.setDate(d.getDate() - 2); // Domingo -> Sexta
      const h = d.getHours();
      if (h < 8 || h >= 18) d.setHours(14); // Padrão seguro para eventos
      return d;
    };

    const base = getBusinessDate(new Date());

    // Retorna N dias úteis para TRÁS
    const d = (daysAgo: number) => {
      let date = new Date(base);
      let count = 0;
      while (count < daysAgo) {
        date.setDate(date.getDate() - 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) count++;
      }
      date.setHours(9 + (count % 8), 15 + (count % 40)); // Aleatório determinístico (09h as 17h)
      return date.toISOString();
    };

    // Retorna N dias úteis para FRENTE
    const dFut = (daysAhead: number) => {
      let date = new Date(base);
      let count = 0;
      while (count < daysAhead) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) count++;
      }
      date.setHours(10 + (count % 7), 20 + (count % 30)); // 10h as 17h
      return date.toISOString();
    };

    const mockEvents: TrackingEvent[] = [
      { id: 'ev0', date: d(10), status: "Código de rastreio cadastrado, aguardando postagem", location: "ACF Expresso - São Paulo / SP", icon: "package", done: true },
      { id: 'ev1', date: d(9), status: "Objeto postado", location: "ACF Expresso - São Paulo / SP", icon: "package", done: true },
      { id: 'ev2', date: d(8), status: "Objeto encaminhado", location: "ACF Expresso - São Paulo / SP", destination: "CTE São Paulo - São Paulo / SP", icon: "truck", done: true },
      { id: 'ev3', date: d(5), status: "Objeto chegou na unidade", location: "CTE São Paulo - São Paulo / SP", icon: "truck", done: true },
      { id: 'ev4', date: d(4), status: "Objeto encaminhado", location: "CTE São Paulo - São Paulo / SP", destination: "CTE Curitiba / PR", icon: "truck", done: true },
      { id: 'ev5', date: d(2), status: "Objeto chegou na unidade", location: "CTE Curitiba / PR", icon: "truck", done: true },
      { id: 'ev_tax', date: d(1), status: taxaPaga ? "Pagamento confirmado: Objeto liberado pela fiscalização aduaneira" : "Aguardando pagamento: Objeto retido na fiscalização aduaneira", location: "Centro de Fiscalização - Curitiba / PR", icon: taxaPaga ? "shield" : "alert", done: true },
    ];

    if (taxaPaga) {
      mockEvents.push({ id: 'ev_tax_paid', date: d(0), status: "Objeto encaminhado para entrega", location: "Unidade de Tratamento - Curitiba / PR", destination: `CDD ${destCity} / ${destState}`, icon: "check", done: true });
      mockEvents.push({ id: 'ev6', date: dFut(2), status: "Objeto encaminhado", location: "CTE Curitiba / PR", destination: `CDD ${destCity} / ${destState}`, icon: "truck", done: false });
    }

    return mockEvents.filter(e => e.done).reverse();
  }
  // ============================================================================

  // Sistema Dinâmico de Linha do Tempo
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
  const now = new Date();

  const city1 = CIDADES[Math.floor(rnd() * CIDADES.length)];
  const franquia = FRANQUIAS[Math.floor(rnd() * FRANQUIAS.length)];
  const bairro = destBairro || BAIRROS[Math.floor(rnd() * BAIRROS.length)];

  // Função central para adicionar tempo respeitando dias úteis e horário comercial (08:00 - 18:00)
  const addDays = (date: Date, days: number, hours: number) => {
    const d = new Date(date);
    let added = 0;
    
    // Avança os dias pulando sábado (6) e domingo (0)
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        added++;
      }
    }
    
    d.setHours(d.getHours() + hours);
    
    // Se, após somar horas, a data cair num fim de semana, avança pra segunda-feira
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
      d.setHours(8); // Se foi empurrado pro próx dia útil, reseta para manhã
    }
    
    // Prende no horário comercial
    const h = d.getHours();
    if (h < 8) d.setHours(8 + Math.floor(rnd() * 3));
    if (h >= 18) d.setHours(14 + Math.floor(rnd() * 3)); // Entre 14h e 17h
    
    return d;
  };

  const destStr = destState ? `${destCity} / ${destState}` : destCity;

  const events: TrackingEvent[] = [];
  
  events.push({ id: "ev0", date: start.toISOString(), status: "Código de rastreio cadastrado, aguardando postagem", location: `ACF ${franquia} - São Paulo / SP`, icon: "package", done: true });

  let postDate = new Date(start);
  postDate.setDate(postDate.getDate() + 1);
  while (postDate.getDay() === 0 || postDate.getDay() === 6) { 
    postDate.setDate(postDate.getDate() + 1);
  }
  postDate.setHours(8 + Math.floor(rnd() * 4), Math.floor(rnd() * 60), 0);

  let currentDate = new Date(postDate);

  events.push({ id: "ev1", date: currentDate.toISOString(), status: "Objeto postado", location: `ACF ${franquia} - São Paulo / SP`, icon: "package", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, Math.floor(rnd() * 4) + 1);
  events.push({ id: "ev2", date: currentDate.toISOString(), status: "Objeto encaminhado", location: `ACF ${franquia} - São Paulo / SP`, destination: `CTE São Paulo - São Paulo / SP`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, Math.floor(rnd() * 8) + 4);
  events.push({ id: "ev3", date: currentDate.toISOString(), status: "Objeto chegou na unidade", location: `CTE São Paulo - São Paulo / SP`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 1, Math.floor(rnd() * 5));
  events.push({ id: "ev4", date: currentDate.toISOString(), status: "Objeto encaminhado", location: `CTE São Paulo - São Paulo / SP`, destination: `CTE ${city1}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 1, Math.floor(rnd() * 12));
  events.push({ id: "ev5", date: currentDate.toISOString(), status: "Objeto chegou na unidade", location: `CTE ${city1}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, Math.floor(rnd() * 4) + 2);
  const taxDate = new Date(currentDate);
  
  events.push({ 
    id: "ev_tax", 
    date: taxDate.toISOString(), 
    status: taxaPaga ? "Pagamento confirmado: Objeto liberado pela fiscalização aduaneira" : "Aguardando pagamento: Objeto retido na fiscalização aduaneira", 
    location: `Centro de Fiscalização - ${city1}`, 
    icon: taxaPaga ? "shield" : "alert", 
    done: taxDate <= now 
  });

  if (!taxaPaga && taxDate <= now) {
    return events.filter(e => e.done).reverse();
  }

  if (taxaPaga && taxDate <= now) {
    currentDate = addDays(taxDate, 0, 1);
    events.push({ id: "ev_tax_paid", date: currentDate.toISOString(), status: "Objeto encaminhado para entrega", location: `Unidade de Tratamento - ${city1}`, destination: `CDD ${destStr}`, icon: "check", done: currentDate <= now });
  }

  currentDate = addDays(currentDate, 0, Math.floor(rnd() * 6) + 2);
  events.push({ id: "ev6", date: currentDate.toISOString(), status: "Objeto encaminhado", location: `CTE ${city1}`, destination: `CDD ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 1, Math.floor(rnd() * 12));
  events.push({ id: "ev7", date: currentDate.toISOString(), status: "Objeto chegou na unidade", location: `CDD ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 0);
  currentDate.setHours(Math.floor(rnd() * 3) + 8, Math.floor(rnd() * 60)); // Saída para entrega pela manhã (8h - 10h)
  events.push({ id: "ev8", date: currentDate.toISOString(), status: "Objeto saiu para entrega ao destinatário", location: `CDD ${bairro} - ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 0);
  currentDate.setHours(currentDate.getHours() + Math.floor(rnd() * 6) + 2); // Leva de 2 a 8 horas para entregar
  if (currentDate.getHours() >= 18) currentDate.setHours(17); // Força última entrega para antes das 18h
  events.push({ id: "ev9", date: currentDate.toISOString(), status: "Objeto entregue ao destinatário", location: `${destStr}`, icon: "check", done: currentDate <= now });

  return events.filter(e => e.done).reverse();
}
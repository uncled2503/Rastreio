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
  "Belém", "Manaus", "São Luís", "Maceió", "Natal", "João Pessoa", "Aracaju", "Teresina", "Campo Grande", "Cuiabá"
];

const FRANQUIAS = [
  "Expresso Correios", "Rápido Centro", "Postal Brasil", "Minas Express", "Log Express",
  "Envio Fácil", "Entrega Já", "Prime Correios"
];

const BAIRROS = [
  "Centro", "Centro Histórico", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste",
  "Industrial", "Bela Vista", "Boa Vista", "Copacabana", "Ipanema", "Barra da Tijuca", "Savassi"
];

export function generateTimeline(code: string, destCity: string, destState: string, destBairro: string, startDateIso: string, taxaPaga: boolean = false): TrackingEvent[] {
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

  const addDays = (date: Date, days: number, hours: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
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
  postDate.setHours(7 + Math.floor(rnd() * 4), Math.floor(rnd() * 60), 0);

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

  // EVENTO DE TAXA (Algumas horas após chegar na cidade intermediária)
  currentDate = addDays(currentDate, 0, Math.floor(rnd() * 4) + 2);
  const taxDate = new Date(currentDate);
  
  events.push({ 
    id: "ev_tax", 
    date: taxDate.toISOString(), 
    status: taxaPaga ? "Objeto liberado pela fiscalização" : "Objeto confiscado/taxado pela receita federal", 
    location: `Alfândega/Fiscalização - ${city1}`, 
    icon: taxaPaga ? "shield" : "alert", 
    done: taxDate <= now 
  });

  // Se a data da taxa já chegou e NÃO foi paga, travamos a linha do tempo aqui!
  if (!taxaPaga && taxDate <= now) {
    return events.filter(e => e.done).reverse();
  }

  // Se pagou, adicionamos a mensagem de liberação logo após o pagamento
  if (taxaPaga && taxDate <= now) {
    currentDate = addDays(taxDate, 0, 1);
    events.push({ id: "ev_tax_paid", date: currentDate.toISOString(), status: "Pedido regularizado, aguarde a continuação da rota", location: `Unidade de Tratamento - ${city1}`, icon: "check", done: currentDate <= now });
  }

  currentDate = addDays(currentDate, 0, Math.floor(rnd() * 6) + 2);
  events.push({ id: "ev6", date: currentDate.toISOString(), status: "Objeto encaminhado", location: `CTE ${city1}`, destination: `CDD ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 1, Math.floor(rnd() * 12));
  events.push({ id: "ev7", date: currentDate.toISOString(), status: "Objeto chegou na unidade", location: `CDD ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 0);
  currentDate.setHours(Math.floor(rnd() * 4) + 8, Math.floor(rnd() * 60));
  events.push({ id: "ev8", date: currentDate.toISOString(), status: "Objeto saiu para entrega ao destinatário", location: `CDD ${bairro} - ${destStr}`, icon: "truck", done: currentDate <= now });

  currentDate = addDays(currentDate, 0, 0);
  currentDate.setHours(currentDate.getHours() + Math.floor(rnd() * 6) + 2);
  events.push({ id: "ev9", date: currentDate.toISOString(), status: "Objeto entregue ao destinatário", location: `${destStr}`, icon: "check", done: currentDate <= now });

  return events.filter(e => e.done).reverse();
}
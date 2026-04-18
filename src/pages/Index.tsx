"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, Truck, Bell, History, ShieldCheck, HelpCircle, ArrowRight, PackageCheck, Zap, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiFraudModal } from '@/components/AntiFraudModal';
import { TrackingResult } from '@/components/TrackingResult';
import { PixModal } from '@/components/PixModal';
import { PlanPixModal } from '@/components/PlanPixModal';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeline, type TrackingEvent } from '@/utils/tracking';

import correiosLogo from '@/assets/correios.png';
import jadlogLogo from '@/assets/jadlog.png';
import loggiLogo from '@/assets/loggi.png';
import totalExpressLogo from '@/assets/total-express.png';

const Index = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [destInfo, setDestInfo] = useState({ 
    city: '', state: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '' 
  });
  
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [pixTransactionId, setPixTransactionId] = useState('');

  const [isPlanPixModalOpen, setIsPlanPixModalOpen] = useState(false);
  const [planPixData, setPlanPixData] = useState({
    pixCopiaECola: '',
    transactionId: '',
    planName: '',
    amount: 0
  });

  const [selectedFaq, setSelectedFaq] = useState<{title: string, content: string} | null>(null);

  const faqs = [
    {
      title: "Minha encomenda não chegou",
      content: "Os prazos de entrega variam de acordo com a transportadora e a modalidade de envio escolhida. Se o prazo estimado já expirou, recomendamos aguardar mais 2 a 3 dias úteis, pois imprevistos na rota (como clima ou trânsito) podem ocorrer. Caso o status continue sem atualização por muito tempo, entre em contato diretamente com a loja onde a compra foi realizada para acionar o seguro ou solicitar um reenvio."
    },
    {
      title: "Paguei taxa, e agora?",
      content: "Após realizar o pagamento do Despacho Postal via PIX, o nosso sistema leva alguns instantes para confirmar a transação com o gateway e atualizar o status no banco de dados. Assim que confirmado, a transportadora será notificada de forma automática e a sua encomenda será liberada da fiscalização para seguir o fluxo normal de entrega até o seu endereço."
    },
    {
      title: "Código não funciona",
      content: "É muito comum que os códigos de rastreio levem até 72 horas úteis para começarem a constar no sistema das transportadoras após a loja confirmar o envio. Isso acontece porque o pacote precisa ser fisicamente despachado e 'bipado' na primeira unidade. Se você acabou de receber o código, aguarde um pouco e tente novamente mais tarde. Verifique também se digitou sem espaços extras."
    },
    {
      title: "Status não atualiza",
      content: "É perfeitamente normal que o status da encomenda demore alguns dias para ser atualizado, especialmente em trechos muito longos entre estados ou em remessas internacionais aguardando fiscalização aduaneira. O rastreio só recebe uma nova atualização quando o pacote chega fisicamente e é escaneado em uma nova unidade de tratamento da transportadora."
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    const index = value.length - 1;
    const char = value[index];

    if (value.length < trackingCode.length) {
      setTrackingCode(value);
      return;
    }

    if (value.length > 12) return;

    const isDigit = (c: string) => /\d/.test(c);
    const isAlpha = (c: string) => /[A-Z]/.test(c);

    let isValid = true;
    if (index === 0 && char !== 'B') isValid = false;
    else if (index === 1 && char !== 'R') isValid = false;
    else if (index >= 2 && index <= 5 && !isDigit(char)) isValid = false;
    else if (index === 6 && !isAlpha(char)) isValid = false;
    else if (index >= 7 && index <= 9 && !isDigit(char)) isValid = false;
    else if (index === 10 && char !== 'B') isValid = false;
    else if (index === 11 && char !== 'R') isValid = false;

    if (isValid) setTrackingCode(value);
  };

  const performSearch = async (codeToSearch: string) => {
    setIsSearching(true);
    const loadingId = showLoading("Buscando informações da sua encomenda...");
    
    try {
      let cidade = "";
      let estado = "";
      let cep = "";
      let endereco = "";
      let numero = "";
      let complemento = "";
      let bairro = "";
      let dataCriacao = new Date().toISOString();

      const { data: lead } = await supabase
        .from('leads')
        .select('cidade, estado, cep, endereco, numero, complemento, bairro, created_at')
        .eq('codigo_rastreio', codeToSearch)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead) {
        if (lead.cidade) cidade = lead.cidade;
        if (lead.estado) estado = lead.estado;
        if (lead.cep) cep = lead.cep;
        if (lead.endereco) endereco = lead.endereco;
        if (lead.numero) numero = lead.numero;
        if (lead.complemento) complemento = lead.complemento;
        if (lead.bairro) bairro = lead.bairro;
        if (lead.created_at) dataCriacao = lead.created_at;
      } else {
        const { data: venda } = await supabase
          .from('vendas')
          .select('created_at, lead_id, cliente_nome')
          .eq('codigo_rastreio', codeToSearch)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!venda && codeToSearch !== 'BR1212H271BR') {
          showError("Encomenda não encontrada em nosso sistema.");
          return;
        }

        if (venda?.created_at) dataCriacao = venda.created_at;

        if (venda?.lead_id) {
          const { data: leadDaVenda } = await supabase
            .from('leads')
            .select('cidade, estado, cep, endereco, numero, complemento, bairro')
            .eq('id', venda.lead_id)
            .limit(1)
            .maybeSingle();
            
          if (leadDaVenda) {
            if (leadDaVenda.cidade) cidade = leadDaVenda.cidade;
            if (leadDaVenda.estado) estado = leadDaVenda.estado;
            if (leadDaVenda.cep) cep = leadDaVenda.cep;
            if (leadDaVenda.endereco) endereco = leadDaVenda.endereco;
            if (leadDaVenda.numero) numero = leadDaVenda.numero;
            if (leadDaVenda.complemento) complemento = leadDaVenda.complemento;
            if (leadDaVenda.bairro) bairro = leadDaVenda.bairro;
          }
        }
        
        if (!cidade && venda?.cliente_nome) {
          const { data: cliente } = await supabase
            .from('clientes')
            .select('cidade')
            .eq('nome', venda.cliente_nome)
            .limit(1)
            .maybeSingle();
            
          if (cliente && cliente.cidade) cidade = cliente.cidade;
        }
      }

      setDestInfo({ city: cidade, state: estado, cep, endereco, numero, complemento, bairro });

      // Busca todos os registros de pagamentos vinculados a esse código em vez de forçar um único com maybeSingle
      const { data: pixRecords } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .contains('raw_payload', { trackingCode: codeToSearch });

      // Se houver qualquer registro aprovado ou pago, a taxa está quitada
      const taxaJaPaga = pixRecords?.some(p => p.status === 'approved' || p.status === 'paid') ?? false;

      const finalCity = cidade || "Seu endereço";
      const finalState = cidade ? estado : "";

      const timeline = generateTimeline(codeToSearch, finalCity, finalState, bairro, dataCriacao, taxaJaPaga);
      
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Encomenda localizada com sucesso!");

      setTimeout(() => {
        const resultElement = document.getElementById('tracking-result');
        if (resultElement) resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      console.error("Erro na busca:", err);
      showError("Ocorreu um erro ao comunicar com a base de dados.");
    } finally {
      dismissToast(loadingId);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.length < 12) {
      showError("O código deve seguir o padrão completo: BR0000X000BR");
      return;
    }
    performSearch(trackingCode);
  };

  const handlePayTax = async () => {
    const loadingId = showLoading("Gerando código PIX...");
    try {
      const { data, error } = await supabase.functions.invoke('create-tax-pix', {
        body: { trackingCode }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPixTransactionId(data.idTransaction);
      setPixCopiaECola(data.pixCopiaECola);
      setIsPixModalOpen(true);
    } catch (err) {
      console.error(err);
      showError("Não foi possível gerar o código PIX. Tente novamente.");
    } finally {
      dismissToast(loadingId);
    }
  };

  const handleBuyPlan = async (planName: string, amount: number) => {
    if (amount === 0) return; // Plano gratuito
    
    const loadingId = showLoading(`Gerando PIX para o plano ${planName}...`);
    try {
      const { data, error } = await supabase.functions.invoke('create-plan-pix', {
        body: { planName, amount }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPlanPixData({
        pixCopiaECola: data.pixCopiaECola,
        transactionId: data.idTransaction,
        planName,
        amount
      });
      setIsPlanPixModalOpen(true);
    } catch (err) {
      console.error(err);
      showError("Não foi possível gerar a cobrança do plano. Tente novamente.");
    } finally {
      dismissToast(loadingId);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPixModalOpen(false);
    // Refaz a busca para atualizar a linha do tempo!
    performSearch(trackingCode);
  };

  const handlePlanPaymentSuccess = () => {
    setIsPlanPixModalOpen(false);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const carriers = [
    { name: 'Correios', logo: correiosLogo, scale: "scale-100" },
    { name: 'Jadlog', logo: jadlogLogo, scale: "scale-100" },
    { name: 'Loggi', logo: loggiLogo, scale: "scale-100" },
    { name: 'Total Express', logo: totalExpressLogo, scale: "scale-100" },
  ];

  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      amount: 0,
      features: ["Até 5 rastreios ativos", "Histórico de 30 dias", "Notificações básicas"],
      button: "Começar Agora",
      highlight: false
    },
    {
      name: "Pro",
      price: "R$ 19,90",
      period: "/mês",
      amount: 19.90,
      features: ["Rastreios ilimitados", "Histórico Vitalício", "Alertas via WhatsApp", "Prioridade de busca"],
      button: "Assinar Pro",
      highlight: true
    },
    {
      name: "Trimestral",
      price: "R$ 49,90",
      period: "/trim",
      amount: 49.90,
      features: ["Tudo do plano Pro", "Economia de R$ 9,80", "Suporte prioritário", "Alertas VIP"],
      button: "Assinar Trimestral",
      highlight: false
    },
    {
      name: "Semestral",
      price: "R$ 89,90",
      period: "/sem",
      amount: 89.90,
      features: ["Tudo do plano Pro", "Economia de R$ 29,50", "Suporte VIP 24/7", "Acesso antecipado"],
      button: "Assinar Semestral",
      highlight: false
    },
    {
      name: "Empresarial",
      price: "R$ 347,90",
      period: "/vitalício",
      amount: 347.90,
      features: ["API de Rastreio", "Dashboard Multi-usuário", "Suporte 24/7", "White Label"],
      button: "Comprar Agora",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 overflow-x-hidden font-sans scroll-smooth">
      <AntiFraudModal />
      
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixCopiaECola}
        transactionId={pixTransactionId}
        onSuccess={handlePaymentSuccess}
      />

      <PlanPixModal 
        isOpen={isPlanPixModalOpen} 
        onClose={() => setIsPlanPixModalOpen(false)} 
        pixCopiaECola={planPixData.pixCopiaECola}
        transactionId={planPixData.transactionId}
        planName={planPixData.planName}
        amount={planPixData.amount}
        onSuccess={handlePlanPaymentSuccess}
      />

      <AnimatePresence>
        {selectedFaq && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedFaq(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 md:p-8">
                <button
                  onClick={() => setSelectedFaq(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-zinc-500" />
                </button>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <HelpCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-4">
                  {selectedFaq.title}
                </h3>
                <p className="text-zinc-600 leading-relaxed">
                  {selectedFaq.content}
                </p>
                <Button
                  onClick={() => setSelectedFaq(null)}
                  className="w-full mt-8 bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-14 rounded-xl text-lg transition-all active:scale-[0.98]"
                >
                  Entendi
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size="md" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <button onClick={() => scrollToSection('como-funciona')} className="hover:text-green-600 transition-colors">Como funciona</button>
            <button onClick={() => scrollToSection('transportadoras')} className="hover:text-green-600 transition-colors">Transportadoras</button>
            <button onClick={() => scrollToSection('planos')} className="hover:text-green-600 transition-colors">Planos</button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold text-zinc-700 hover:text-green-600">Entrar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">CADASTRE-SE</Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-green-100"
          >
            <Zap size={16} /> Rastreamento em Tempo Real
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black text-zinc-900 mb-6 leading-tight"
          >
            Rastreie suas encomendas <br className="hidden md:block" /> 
            <span className="text-green-600">em segundos.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-500 mb-12 max-w-2xl mx-auto font-medium"
          >
            Acompanhe pedidos de qualquer transportadora em um só lugar. Centralize suas compras e receba alertas automáticos.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-3xl mx-auto"
          >
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-green-400/20 blur-2xl group-hover:bg-green-400/30 transition-all rounded-3xl" />
              <div className="relative flex flex-col md:flex-row gap-3 p-3 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <Search className="text-zinc-400 shrink-0" size={24} />
                  <input 
                    type="text" 
                    placeholder="BR0000A000BR"
                    className="w-full h-14 md:h-16 outline-none text-lg font-mono font-bold tracking-widest text-zinc-800 placeholder:text-zinc-300"
                    value={trackingCode}
                    maxLength={12}
                    onChange={handleInputChange}
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white h-14 md:h-16 px-8 text-lg font-black rounded-2xl transition-all shadow-lg shadow-green-600/20 active:scale-[0.98]"
                >
                  {isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}
                </Button>
              </div>
            </form>
          </motion.div>

          <motion.div 
            id="transportadoras"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 pt-8"
          >
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">Compatível com +100 transportadoras</p>
            <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center items-center gap-x-8 gap-y-10 md:gap-16 px-4">
              {carriers.map((carrier) => (
                <div key={carrier.name} className="flex items-center justify-center h-10 md:h-14">
                  <img 
                    src={carrier.logo} 
                    alt={carrier.name} 
                    className={`max-h-full w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 ${carrier.scale}`}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div id="tracking-result">
        {showResult && (
          <TrackingResult 
            code={trackingCode} 
            data={events} 
            destInfo={destInfo}
            onPayTax={handlePayTax}
          />
        )}
      </div>

      <section className="py-24 bg-white border-y border-zinc-100 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="text-orange-500" size={32} />,
                title: "Tempo Real",
                desc: "Receba atualizações instantâneas sobre o status da sua entrega diretamente no app."
              },
              {
                icon: <Bell className="text-blue-500" size={32} />,
                title: "Notificações",
                desc: "Fique por dentro de cada passo sem precisar atualizar a página o tempo todo."
              },
              {
                icon: <History className="text-green-500" size={32} />,
                title: "Histórico Completo",
                desc: "Mantenha todos os seus pedidos anteriores salvos para consulta futura rápida."
              }
            ].map((benefit, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-[#F8FAFC] border border-zinc-50 transition-all hover:shadow-xl hover:shadow-zinc-200/50"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-24 px-4 overflow-hidden scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Como o RastreAR <br className="hidden md:block" /> facilita sua vida</h2>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Insira seu código", text: "Basta colar o código de rastreio recebido da sua loja favorita." },
                  { step: "02", title: "Processamento rápido", text: "Nossa IA identifica a transportadora e busca os dados em milissegundos." },
                  { step: "03", title: "Acompanhe tudo", text: "Veja em uma linha do tempo intuitiva onde está sua encomenda." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="text-4xl font-black text-zinc-100 group-hover:text-green-100 transition-colors">{item.step}</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-zinc-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-10 animate-pulse" />
              <div className="relative bg-zinc-900 rounded-[3rem] p-4 shadow-2xl border-8 border-zinc-800 rotate-3 transform hover:rotate-0 transition-all duration-500 max-w-[320px] mx-auto">
                 <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                   <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                     <PackageCheck className="text-green-600 mb-4" size={48} />
                     <h5 className="font-bold text-lg mb-2">Entrega Realizada!</h5>
                     <p className="text-xs text-zinc-400">Seu pacote chegou ao destino final em Curitiba - PR.</p>
                     <div className="w-full mt-8 space-y-3">
                       {[1,2,3].map(i => <div key={i} className="h-2 w-full bg-zinc-100 rounded-full" />)}
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="py-24 bg-white border-y border-zinc-100 px-4 scroll-mt-20">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Planos para todos</h2>
          <p className="text-zinc-500 mb-16 max-w-2xl mx-auto">Escolha o plano que melhor atende suas necessidades de rastreamento.</p>
          
          <div className="flex flex-wrap justify-center gap-8">
            {plans.map((plan, idx) => (
              <div key={idx} className={`w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] p-10 rounded-[2.5rem] border-2 transition-all ${plan.highlight ? 'border-green-500 bg-white shadow-2xl shadow-green-100 relative' : 'border-zinc-100 bg-zinc-50/50'}`}>
                {plan.highlight && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Mais Popular</span>
                )}
                <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                <div className="flex items-end justify-center gap-1 mb-8">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.period && <span className="text-zinc-400 text-sm font-bold mb-1">{plan.period}</span>}
                </div>
                <ul className="space-y-4 mb-10 text-left">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-3 text-sm text-zinc-600 font-medium">
                      <Check className="text-green-500 shrink-0" size={18} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleBuyPlan(plan.name, plan.amount)}
                  className={`w-full h-14 rounded-2xl font-black text-lg transition-all ${plan.highlight ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'}`}
                >
                  {plan.button}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-900 text-white px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Dúvidas comuns</h2>
            <p className="text-zinc-400">Encontre respostas rápidas para seus problemas de entrega.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedFaq(faq)}
                className="p-8 rounded-3xl bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer group"
              >
                <HelpCircle className="text-green-500 mb-4" size={24} />
                <h4 className="font-bold text-lg mb-4 group-hover:text-green-400 transition-colors">{faq.title}</h4>
                <div className="flex items-center gap-2 text-sm text-zinc-400 font-bold group-hover:translate-x-1 transition-transform">
                  Ver artigo <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl bg-gradient-to-br from-green-600 to-green-700 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-green-600/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Comece agora gratuitamente</h2>
            <p className="text-green-50 mb-10 text-lg opacity-90 max-w-xl mx-auto">
              Crie sua conta em 30 segundos e salve todos os seus códigos de rastreio em um dashboard exclusivo.
            </p>
            <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 font-black px-12 h-16 rounded-2xl text-xl transition-all shadow-xl active:scale-95">
              CRIAR MINHA CONTA GRÁTIS
            </Button>
            <p className="mt-6 text-sm text-green-100/70 flex items-center justify-center gap-2 font-medium">
              <ShieldCheck size={16} /> Sem taxas ocultas. Privacidade 100% garantida.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-zinc-100 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 border-b border-zinc-100 pb-12 mb-12">
            <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo size="lg" />
            </div>
            
            <div className="flex flex-wrap gap-8 text-sm font-bold text-zinc-500 uppercase tracking-widest">
              <Link to="/termos" className="hover:text-green-600 transition-colors">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-green-600 transition-colors">Privacidade</Link>
              <Link to="/afiliados" className="hover:text-green-600 transition-colors">Afiliados</Link>
              <Link to="/suporte" className="hover:text-green-600 transition-colors">Suporte</Link>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-400 text-sm font-medium">
            <p>© 2024 RastreAR Logistics. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2">
              Feito com ⚡ para uma logística inteligente.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
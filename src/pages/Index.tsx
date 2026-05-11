"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, ShieldCheck, ShieldAlert, Package, Truck, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiFraudModal } from '@/components/AntiFraudModal';
import { TrackingResult } from '@/components/TrackingResult';
import { PixModal } from '@/components/PixModal';
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
  const [destInfo, setDestInfo] = useState({ city: '', state: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '' });
  
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState({ copiaECola: '', transactionId: '', amount: 19.90, title: '' });

  const performSearch = async (codeToSearch: string) => {
    if (!codeToSearch || codeToSearch.length < 12) {
      showError("Digite um código de rastreio válido.");
      return;
    }

    setIsSearching(true);
    const loadingId = showLoading("Buscando informações...");
    try {
      const { data: lead } = await supabase.from('leads').select('*').eq('codigo_rastreio', codeToSearch).maybeSingle();
      const city = lead?.cidade || "Sua Cidade";
      const state = lead?.estado || "";
      const created = lead?.created_at || new Date().toISOString();

      setDestInfo({ 
        city, state, 
        cep: lead?.cep || '', endereco: lead?.endereco || '', 
        numero: lead?.numero || '', complemento: lead?.complemento || '', 
        bairro: lead?.bairro || '' 
      });

      const { data: statusData } = await supabase.functions.invoke('check-pix-status', { body: { trackingCode: codeToSearch } });
      
      const timeline = generateTimeline(codeToSearch, city, state, lead?.bairro || "", created, statusData?.taxa1990, statusData?.taxa990);
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Encomenda localizada!");
      
      // Scroll suave para o resultado
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      showError("Não encontramos informações para este código.");
    } finally {
      dismissToast(loadingId);
      setIsSearching(false);
    }
  };

  const handlePayTax = async () => {
    const activeEvent = events.find(e => e.icon === 'alert');
    if (!activeEvent) return;

    const amount = activeEvent.amount || 19.90;
    const title = amount === 19.90 ? "Despacho Postal" : "Seguro de Entrega Urbana";

    const loadingId = showLoading("Gerando PIX seguro...");
    try {
      const { data } = await supabase.functions.invoke('create-tax-pix', { body: { trackingCode, amount } });
      setPixData({ copiaECola: data.pixCopiaECola, transactionId: data.idTransaction, amount, title });
      setIsPixModalOpen(true);
    } catch {
      showError("Erro ao gerar PIX. Tente novamente.");
    } finally {
      dismissToast(loadingId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans selection:bg-green-100">
      <AntiFraudModal />
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixData.copiaECola}
        transactionId={pixData.transactionId}
        onSuccess={() => { setIsPixModalOpen(false); performSearch(trackingCode); }}
        amount={pixData.amount}
        title={pixData.title}
      />

      {/* Header Fixo */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 h-20 flex items-center">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-500">
            <a href="#" className="hover:text-green-600 transition-colors">Início</a>
            <a href="#" className="hover:text-green-600 transition-colors">Como funciona</a>
            <a href="#" className="hover:text-green-600 transition-colors">Suporte</a>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl px-6 h-11 shadow-lg shadow-green-600/20 transition-all active:scale-95">
            ÁREA DO CLIENTE
          </Button>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section com Busca */}
        <section className="container mx-auto px-4 text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-black tracking-widest uppercase mb-6 border border-green-100">
              <Zap size={14} className="fill-green-600" /> Rastreamento em Tempo Real
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
              Acompanhe sua <span className="text-green-600">encomenda</span> de forma inteligente.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Consulte o status detalhado da sua entrega em todas as transportadoras nacionais e internacionais em um só lugar.
            </p>

            <form 
              onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} 
              className="relative group max-w-2xl mx-auto"
            >
              <div className="absolute inset-0 bg-green-600/5 blur-2xl rounded-[2.5rem] transition-all group-focus-within:bg-green-600/10" />
              <div className="relative flex flex-col md:flex-row gap-3 p-2.5 bg-white border-2 border-zinc-100 rounded-[2rem] shadow-2xl shadow-zinc-200/50 transition-all focus-within:border-green-500/30">
                <div className="flex-1 flex items-center px-5 gap-4">
                  <Search className="text-zinc-300 group-focus-within:text-green-500 transition-colors" size={24} />
                  <input 
                    className="w-full h-12 md:h-14 bg-transparent text-xl font-mono font-bold outline-none text-zinc-800 placeholder:text-zinc-300 tracking-wider"
                    placeholder="BR0000X000BR"
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value.toUpperCase())}
                    maxLength={12}
                  />
                </div>
                <Button 
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white h-12 md:h-14 px-10 rounded-[1.2rem] font-black text-base shadow-xl shadow-green-600/20 active:scale-95 transition-all"
                >
                  {isSearching ? 'BUSCANDO...' : 'RASTREAR'}
                </Button>
              </div>
            </form>
            
            {/* Transportadoras */}
            <div className="mt-16 pt-16 border-t border-zinc-100">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-10">Transportadoras Parceiras</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all">
                <img src={correiosLogo} alt="Correios" className="h-6 md:h-8 object-contain" />
                <img src={jadlogLogo} alt="Jadlog" className="h-5 md:h-7 object-contain" />
                <img src={loggiLogo} alt="Loggi" className="h-6 md:h-8 object-contain" />
                <img src={totalExpressLogo} alt="Total Express" className="h-5 md:h-7 object-contain" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Seção de Resultados */}
        <section id="result-section" className="scroll-mt-32">
          <AnimatePresence mode="wait">
            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="container mx-auto px-4"
              >
                <TrackingResult 
                  code={trackingCode} 
                  data={events} 
                  destInfo={destInfo} 
                  onPayTax={handlePayTax} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Benefícios */}
        {!showResult && (
          <section className="container mx-auto px-4 mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <ShieldCheck className="text-green-600" />, title: "Segurança Total", desc: "Seus dados e encomendas protegidos com criptografia de ponta a ponta." },
                { icon: <Clock className="text-blue-600" />, title: "Atualização Real", desc: "Receba notificações instantâneas sobre qualquer mudança no status." },
                { icon: <HelpCircle className="text-purple-600" />, title: "Suporte 24/7", desc: "Nossa equipe está pronta para ajudar com qualquer dúvida no seu trajeto." }
              ].map((item, idx) => (
                <div key={idx} className="p-8 bg-white border border-zinc-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <Logo size="sm" className="opacity-50" />
            <div className="flex gap-8 text-sm font-bold text-zinc-400">
              <a href="/termos" className="hover:text-zinc-900 transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-zinc-900 transition-colors">Privacidade</a>
              <a href="/suporte" className="hover:text-zinc-900 transition-colors">Ajuda</a>
            </div>
            <p className="text-sm text-zinc-400">© 2024 TrackPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
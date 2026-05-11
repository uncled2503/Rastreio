"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Zap, X, HelpCircle, ArrowRight, ShieldCheck, 
  ShieldAlert, PackageCheck, Headphones, FileText, Share2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiFraudModal } from '@/components/AntiFraudModal';
import { TrackingResult } from '@/components/TrackingResult';
import { PixModal } from '@/components/PixModal';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeline, type TrackingEvent } from '@/utils/tracking';
import { useNavigate } from 'react-router-dom';

import correiosLogo from '@/assets/correios.png';
import jadlogLogo from '@/assets/jadlog.png';
import loggiLogo from '@/assets/loggi.png';
import totalExpressLogo from '@/assets/total-express.png';

const Index = () => {
  const navigate = useNavigate();
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
    const loadingId = showLoading("Localizando sua encomenda...");
    try {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('codigo_rastreio', codeToSearch)
        .maybeSingle();

      const city = lead?.cidade || "Sua Cidade";
      const state = lead?.estado || "";
      const created = lead?.created_at || new Date().toISOString();

      setDestInfo({ 
        city, state, 
        cep: lead?.cep || '', 
        endereco: lead?.endereco || '', 
        numero: lead?.numero || '', 
        complemento: lead?.complemento || '', 
        bairro: lead?.bairro || '' 
      });

      const { data: statusData } = await supabase.functions.invoke('check-pix-status', { 
        body: { trackingCode: codeToSearch } 
      });
      
      const timeline = generateTimeline(
        codeToSearch, 
        city, 
        state, 
        lead?.bairro || "", 
        created, 
        statusData?.taxa1990, 
        statusData?.taxa990
      );

      setEvents(timeline);
      setShowResult(true);
      showSuccess("Encomenda localizada!");
      
      // Scroll suave para o resultado
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error(err);
      showError("Erro ao buscar informações. Tente novamente.");
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

    const loadingId = showLoading("Gerando seu PIX seguro...");
    try {
      const { data } = await supabase.functions.invoke('create-tax-pix', { 
        body: { trackingCode, amount } 
      });
      setPixData({ copiaECola: data.pixCopiaECola, transactionId: data.idTransaction, amount, title });
      setIsPixModalOpen(true);
    } catch {
      showError("Não foi possível gerar o pagamento. Tente novamente.");
    } finally {
      dismissToast(loadingId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans selection:bg-green-100 selection:text-green-900">
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

      {/* Navegação */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 h-20 flex items-center px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Logo size="md" className="hover:scale-105 transition-transform cursor-pointer" />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-500 uppercase tracking-widest">
            <a href="#faq" className="hover:text-green-600 transition-colors">Dúvidas</a>
            <a href="/suporte" className="hover:text-green-600 transition-colors">Suporte</a>
          </div>
          <Button onClick={() => navigate('/suporte')} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl px-6 h-12 shadow-lg shadow-zinc-200">
            MINHA CONTA
          </Button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-green-100"
            >
              <Zap size={14} fill="currentColor" />
              Rastreamento em tempo real
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[1.1]"
            >
              Siga cada passo da sua <span className="text-green-600">encomenda.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium"
            >
              Acompanhe seus pedidos das principais transportadoras do Brasil em uma única plataforma inteligente e segura.
            </motion.p>

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} 
              className="relative max-w-2xl mx-auto group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex flex-col md:flex-row gap-3 p-3 bg-white rounded-[2rem] shadow-2xl border border-zinc-100">
                <div className="flex-1 flex items-center px-6 gap-4">
                  <Search className="text-zinc-400" size={24} />
                  <input 
                    className="w-full h-14 bg-transparent text-xl font-mono font-black outline-none placeholder:text-zinc-300 tracking-widest uppercase"
                    placeholder="BR0000X000BR"
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value.toUpperCase())}
                    maxLength={12}
                  />
                </div>
                <Button 
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white h-14 px-10 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl shadow-green-200"
                >
                  {isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}
                </Button>
              </div>
            </motion.form>
          </div>

          {/* Resultado */}
          <div id="result-section">
            <AnimatePresence>
              {showResult && (
                <TrackingResult 
                  code={trackingCode} 
                  data={events} 
                  destInfo={destInfo} 
                  onPayTax={handlePayTax} 
                />
              )}
            </AnimatePresence>
          </div>

          {/* Transportadoras */}
          {!showResult && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-24 pt-12 border-t border-zinc-100"
            >
              <p className="text-center text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-10">Conectado às melhores redes</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <img src={correiosLogo} alt="Correios" className="h-8 md:h-10 object-contain" />
                <img src={jadlogLogo} alt="Jadlog" className="h-6 md:h-8 object-contain" />
                <img src={loggiLogo} alt="Loggi" className="h-6 md:h-8 object-contain" />
                <img src={totalExpressLogo} alt="Total Express" className="h-5 md:h-7 object-contain" />
              </div>
            </motion.div>
          )}

          {/* Seção de FAQ */}
          <section id="faq" className="mt-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Dúvidas Frequentes</h2>
              <p className="text-zinc-500 font-medium">Tudo o que você precisa saber sobre seu rastreio.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { q: "Como vejo o status da entrega?", a: "Basta inserir seu código de 12 dígitos no campo de busca acima para ver a linha do tempo detalhada." },
                { q: "O que é a Taxa de Despacho?", a: "É um valor cobrado para processar encomendas internacionais ou prioritárias retidas na fiscalização." },
                { q: "Qual o prazo de entrega?", a: "O prazo varia conforme a transportadora, mas geralmente leva de 5 a 15 dias úteis após a liberação." },
                { q: "O site é seguro?", a: "Sim, utilizamos criptografia de ponta a ponta e somos parceiros oficiais das maiores transportadoras." }
              ].map((faq, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <HelpCircle size={18} className="text-green-600" />
                    {faq.q}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed font-medium">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="bg-white border-t border-zinc-100 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <Logo size="md" className="mb-6" />
              <p className="text-zinc-500 font-medium max-w-sm">
                A solução definitiva para quem não quer perder nenhum detalhe do trajeto de suas compras online. Inteligência artificial aplicada à logística.
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-6">Links Úteis</h4>
              <ul className="space-y-4 font-bold text-zinc-600 text-sm">
                <li><a href="/termos" className="hover:text-green-600 transition-colors">Termos de Uso</a></li>
                <li><a href="/privacidade" className="hover:text-green-600 transition-colors">Privacidade</a></li>
                <li><a href="/afiliados" className="hover:text-green-600 transition-colors">Afiliados</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-6">Ajuda</h4>
              <ul className="space-y-4 font-bold text-zinc-600 text-sm">
                <li><a href="/suporte" className="hover:text-green-600 transition-colors">Suporte 24h</a></li>
                <li><a href="#faq" className="hover:text-green-600 transition-colors">Perguntas Frequentes</a></li>
                <li className="text-zinc-400">suporte@trackpro.com</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-zinc-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              © 2024 TrackPro Logistics S.A. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 grayscale opacity-50">
              <ShieldCheck size={24} />
              <PackageCheck size={24} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
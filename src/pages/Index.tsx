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
  const [pixAmount, setPixAmount] = useState(15.90);

  const [isPlanPixModalOpen, setIsPlanPixModalOpen] = useState(false);
  const [planPixData, setPlanPixData] = useState({
    pixCopiaECola: '',
    transactionId: '',
    planName: '',
    amount: 0
  });

  const [selectedFaq, setSelectedFaq] = useState<{title: string, content: string} | null>(null);

  const faqs = [
    { title: "Minha encomenda não chegou", content: "Os prazos de entrega variam de acordo com a transportadora e a modalidade de envio escolhida..." },
    { title: "Paguei taxa, e agora?", content: "Após realizar o pagamento do Despacho Postal via PIX, o nosso sistema leva alguns instantes..." },
    { title: "Código não funciona", content: "É muito comum que os códigos de rastreio levem até 72 horas úteis para começarem a constar..." },
    { title: "Status não atualiza", content: "É perfeitamente normal que o status da encomenda demore alguns dias para ser atualizado..." }
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
        dataCriacao = lead.created_at || new Date().toISOString();
      }

      setDestInfo({ city: cidade, state: estado, cep, endereco, numero, complemento, bairro });

      const { data: statusData } = await supabase.functions.invoke('check-pix-status', {
        body: { trackingCode: codeToSearch }
      });
      const taxaJaPaga = statusData?.taxaPaga ?? false;

      const timeline = generateTimeline(codeToSearch, cidade || "Seu endereço", estado, bairro, dataCriacao, taxaJaPaga);
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Encomenda localizada com sucesso!");

      setTimeout(() => {
        document.getElementById('tracking-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      showError("Erro ao comunicar com a base de dados.");
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

      if (error || data.error) throw new Error(data.error || "Erro ao gerar PIX");

      setPixTransactionId(data.idTransaction);
      setPixCopiaECola(data.pixCopiaECola);
      setPixAmount(data.amount);
      setIsPixModalOpen(true);
    } catch (err) {
      showError("Não foi possível gerar o código PIX.");
    } finally {
      dismissToast(loadingId);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPixModalOpen(false);
    performSearch(trackingCode);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 overflow-x-hidden font-sans scroll-smooth">
      <AntiFraudModal />
      
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixCopiaECola}
        transactionId={pixTransactionId}
        amount={pixAmount}
        onSuccess={handlePaymentSuccess}
      />

      <PlanPixModal 
        isOpen={isPlanPixModalOpen} 
        onClose={() => setIsPlanPixModalOpen(false)} 
        pixCopiaECola={planPixData.pixCopiaECola}
        transactionId={planPixData.transactionId}
        planName={planPixData.planName}
        amount={planPixData.amount}
        onSuccess={() => setIsPlanPixModalOpen(false)}
      />

      <AnimatePresence>
        {selectedFaq && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedFaq(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
              <div className="p-6 md:p-8">
                <button onClick={() => setSelectedFaq(null)} className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} className="text-zinc-500" /></button>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6"><HelpCircle size={32} /></div>
                <h3 className="text-2xl font-black text-zinc-900 mb-4">{selectedFaq.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{selectedFaq.content}</p>
                <Button onClick={() => setSelectedFaq(null)} className="w-full mt-8 bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-14 rounded-xl text-lg transition-all active:scale-[0.98]">Entendi</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Logo size="md" /></div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <button className="hover:text-green-600">Como funciona</button>
            <button className="hover:text-green-600">Transportadoras</button>
            <button className="hover:text-green-600">Planos</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold text-zinc-700 hover:text-green-600">Entrar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">CADASTRE-SE</Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-green-100"><Zap size={16} /> Rastreamento em Tempo Real</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-7xl font-black text-zinc-900 mb-6 leading-tight">Rastreie suas encomendas <br className="hidden md:block" /> <span className="text-green-600">em segundos.</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-zinc-500 mb-12 max-w-2xl mx-auto font-medium">Acompanhe pedidos de qualquer transportadora em um só lugar.</motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="w-full max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-green-400/20 blur-2xl rounded-3xl" />
              <div className="relative flex flex-col md:flex-row gap-3 p-3 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl">
                <div className="flex-1 flex items-center px-4 gap-3"><Search className="text-zinc-400 shrink-0" size={24} /><input type="text" placeholder="BR0000A000BR" className="w-full h-14 md:h-16 outline-none text-lg font-mono font-bold tracking-widest text-zinc-800" value={trackingCode} maxLength={12} onChange={handleInputChange} /></div>
                <Button type="submit" disabled={isSearching} className="bg-green-600 hover:bg-green-700 text-white h-14 md:h-16 px-8 text-lg font-black rounded-2xl shadow-lg active:scale-[0.98]">{isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      <div id="tracking-result">{showResult && <TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} />}</div>

      <footer className="py-20 border-t border-zinc-100 px-4 bg-white">
        <div className="container mx-auto max-w-6xl text-center text-zinc-400 text-sm font-medium">
          <Logo size="lg" className="mx-auto mb-8" />
          <p>© 2024 RastreAR Logistics. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
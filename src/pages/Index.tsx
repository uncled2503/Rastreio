"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, X, HelpCircle, ArrowRight, ShieldCheck, ShieldAlert, PackageCheck } from 'lucide-react';
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
  const [pixData, setPixData] = useState({ copiaECola: '', transactionId: '', amount: 15.90, title: '' });

  const performSearch = async (codeToSearch: string) => {
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
      
      const timeline = generateTimeline(codeToSearch, city, state, lead?.bairro || "", created, statusData?.taxa1590, statusData?.taxa990);
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Localizado!");
    } catch (err) {
      showError("Erro ao buscar.");
    } finally {
      dismissToast(loadingId);
      setIsSearching(false);
    }
  };

  const handlePayTax = async () => {
    const activeEvent = events.find(e => e.icon === 'alert');
    if (!activeEvent) return;

    const amount = activeEvent.amount || 15.90;
    const title = amount === 15.90 ? "Despacho Postal" : "Seguro de Entrega Urbana";

    const loadingId = showLoading("Gerando PIX...");
    try {
      const { data } = await supabase.functions.invoke('create-tax-pix', { body: { trackingCode, amount } });
      setPixData({ copiaECola: data.pixCopiaECola, transactionId: data.idTransaction, amount, title });
      setIsPixModalOpen(true);
    } catch {
      showError("Erro ao gerar PIX.");
    } finally {
      dismissToast(loadingId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans">
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

      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 h-20 flex items-center px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Logo size="md" />
          <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">ENTRAR</Button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6">Rastreio Inteligente</h1>
          <form onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} className="relative mb-12">
            <input 
              className="w-full h-16 rounded-2xl border-2 border-zinc-100 px-6 text-xl font-mono font-bold outline-none focus:border-green-500 transition-all"
              placeholder="BR0000X000BR"
              value={trackingCode}
              onChange={e => setTrackingCode(e.target.value.toUpperCase())}
            />
            <Button className="absolute right-2 top-2 h-12 bg-green-600 px-8 rounded-xl font-black">RASTREAR</Button>
          </form>

          {showResult && <TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiFraudModal } from '@/components/AntiFraudModal';
import { TrackingResult } from '@/components/TrackingResult';
import { PixModal } from '@/components/PixModal';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeline, type TrackingEvent } from '@/utils/tracking';

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
      showSuccess("Localizado!");
    } catch (err) { showError("Erro na busca."); }
    finally { dismissToast(loadingId); setIsSearching(false); }
  };

  const handlePayTax = async () => {
    const loadingId = showLoading("Gerando PIX...");
    try {
      const { data } = await supabase.functions.invoke('create-tax-pix', { body: { trackingCode } });
      setPixTransactionId(data.idTransaction);
      setPixCopiaECola(data.pixCopiaECola);
      setPixAmount(data.amount);
      setIsPixModalOpen(true);
    } catch (err) { showError("Erro ao gerar PIX."); }
    finally { dismissToast(loadingId); }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans scroll-smooth">
      <AntiFraudModal />
      <PixModal isOpen={isPixModalOpen} onClose={() => setIsPixModalOpen(false)} pixCopiaECola={pixCopiaECola} transactionId={pixTransactionId} amount={pixAmount} onSuccess={() => { setIsPixModalOpen(false); performSearch(trackingCode); }} />

      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 h-20 flex items-center px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Logo size="md" />
          <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">CADASTRE-SE</Button>
        </div>
      </nav>

      <section className="pt-40 pb-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 leading-[1.1]">Rastreie em <span className="text-green-600">tempo real.</span></h1>
          <form onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} className="max-w-3xl mx-auto mb-20">
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl">
              <div className="flex-1 flex items-center px-4 gap-3">
                <Search className="text-zinc-400" size={24} />
                <input type="text" placeholder="BR0000A000BR" className="w-full h-14 outline-none text-lg font-mono font-bold tracking-widest" value={trackingCode} maxLength={12} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} />
              </div>
              <Button type="submit" disabled={isSearching} className="bg-green-600 hover:bg-green-700 text-white h-16 px-10 text-lg font-black rounded-2xl">RASTREAR AGORA</Button>
            </div>
          </form>
        </div>
      </section>

      {showResult && <div className="pb-20"><TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} /></div>}
    </div>
  );
};

export default Index;
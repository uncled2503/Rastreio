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
        window.scrollTo({ top: resElement.offsetTop - 50, behavior: 'smooth' });
      }
    } catch (err) { 
      showError("Erro na busca."); 
    } finally { 
      dismissToast(loadingId); 
      setIsSearching(false); 
    }
  };

  const handlePayTax = async () => {
    const loadingId = showLoading("Gerando PIX...");
    try {
      const { data } = await supabase.functions.invoke('create-tax-pix', { body: { trackingCode } });
      setPixTransactionId(data.idTransaction);
      setPixCopiaECola(data.pixCopiaECola);
      setPixAmount(data.amount);
      setIsPixModalOpen(true);
    } catch (err) { 
      showError("Erro ao gerar PIX."); 
    } finally { 
      dismissToast(loadingId); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans selection:bg-green-100 p-4 md:p-8">
      <AntiFraudModal />
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixCopiaECola} 
        transactionId={pixTransactionId} 
        amount={pixAmount} 
        onSuccess={() => { setIsPixModalOpen(false); performSearch(trackingCode); }} 
      />

      <div className="max-w-4xl mx-auto pt-12 md:pt-20">
        <nav className="flex justify-center mb-16">
          <Logo size="md" />
        </nav>

        <main className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 mb-6 tracking-tight">
            Rastreamento de <span className="text-green-600">Encomendas</span>
          </h1>
          <p className="text-zinc-500 text-lg mb-12 max-w-xl mx-auto font-medium">
            Acompanhe o status do seu pedido em tempo real. Digite seu código abaixo para começar.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} 
            className="max-w-2xl mx-auto p-2 bg-white border border-zinc-100 rounded-[2rem] shadow-xl flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center px-6 gap-4">
              <Search className="text-zinc-300" size={22} />
              <input 
                type="text" 
                placeholder="BR0000A000BR" 
                className="w-full h-12 outline-none text-lg font-bold tracking-[0.2em] text-zinc-800 placeholder:text-zinc-200" 
                value={trackingCode} 
                maxLength={12} 
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} 
              />
            </div>
            <Button type="submit" disabled={isSearching} className="bg-green-600 hover:bg-green-700 text-white h-14 px-10 text-sm font-black rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">
              {isSearching ? 'BUSCANDO...' : 'RASTREAR'}
            </Button>
          </form>
        </main>

        {showResult && (
          <section id="resultado" className="pt-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} />
          </section>
        )}

        <footer className="mt-20 pt-12 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
          <p>© 2024 RastreAR Logistics. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <a href="/termos" className="hover:text-zinc-900 transition-colors">Termos</a>
            <a href="/privacidade" className="hover:text-zinc-900 transition-colors">Privacidade</a>
            <a href="/suporte" className="hover:text-zinc-900 transition-colors">Suporte</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
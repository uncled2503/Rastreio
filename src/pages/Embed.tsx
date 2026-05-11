"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackingResult } from '@/components/TrackingResult';
import { PixModal } from '@/components/PixModal';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeline, type TrackingEvent } from '@/utils/tracking';

const Embed = () => {
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
  const [pixAmount, setPixAmount] = useState(0);

  // Auto-busca se o código for passado na URL (ex: ?codigo=BR123456789BR)
  useEffect(() => {
    const codeFromUrl = searchParams.get('codigo') || searchParams.get('code');
    if (codeFromUrl && codeFromUrl.length >= 12) {
      const upperCode = codeFromUrl.toUpperCase();
      setTrackingCode(upperCode);
      performSearch(upperCode);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    if (value.length > 12) return;
    
    // Validação básica: deve começar com BR
    if (value.length >= 1 && value[0] !== 'B') return;
    if (value.length >= 2 && value[1] !== 'R') return;

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
        dataCriacao = lead.created_at || dataCriacao;
      } else {
        const { data: venda } = await supabase
          .from('vendas')
          .select('*')
          .eq('codigo_rastreio', codeToSearch)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const isTestCode = ['BR1212H271BR', 'BR8888T888BR', 'BR1REAL111BR', 'BR9999X999BR'].includes(codeToSearch);

        if (!venda && !isTestCode) {
          showError("Encomenda não encontrada em nosso sistema.");
          return;
        }

        if (venda?.created_at) dataCriacao = venda.created_at;
      }

      setDestInfo({ city: cidade, state: estado, cep, endereco, numero, complemento, bairro });

      const { data: statusData } = await supabase.functions.invoke('check-pix-status', {
        body: { trackingCode: codeToSearch }
      });
      const paymentsCount = statusData?.paymentsCount ?? 0;

      const timeline = generateTimeline(codeToSearch, cidade || "Seu endereço", estado || "", bairro || "", dataCriacao, paymentsCount);
      
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Encomenda localizada com sucesso!");

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
      setPixAmount(data.amount);
      setIsPixModalOpen(true);
    } catch (err) {
      console.error(err);
      showError("Não foi possível gerar o código PIX. Tente novamente.");
    } finally {
      dismissToast(loadingId);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPixModalOpen(false);
    performSearch(trackingCode);
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans">
      <PixModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        pixCopiaECola={pixCopiaECola}
        transactionId={pixTransactionId}
        amount={pixAmount}
        onSuccess={handlePaymentSuccess}
      />

      <div className="w-full max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-3 p-2 bg-white border border-zinc-200 rounded-3xl shadow-lg">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Search className="text-zinc-400 shrink-0" size={24} />
              <input 
                type="text" 
                placeholder="BR0000A000BR"
                className="w-full h-12 md:h-14 outline-none text-lg font-mono font-bold tracking-widest text-zinc-800 placeholder:text-zinc-300"
                value={trackingCode}
                maxLength={12}
                onChange={handleInputChange}
              />
            </div>
            <Button 
              type="submit"
              disabled={isSearching}
              className="bg-green-600 hover:bg-green-700 text-white h-12 md:h-14 px-8 text-base font-black rounded-2xl transition-all shadow-md active:scale-[0.98]"
            >
              {isSearching ? 'BUSCANDO...' : 'RASTREAR'}
            </Button>
          </div>
        </form>

        {showResult && (
          <div className="-mt-6">
            <TrackingResult 
              code={trackingCode} 
              data={events} 
              destInfo={destInfo}
              onPayTax={handlePayTax}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Embed;
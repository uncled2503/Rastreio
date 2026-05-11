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
      
      window.scrollTo({ top: document.getElementById('resultado')?.offsetTop ? document.getElementById('resultado')!.offsetTop - 100 : 0, behavior: 'smooth' });
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
    } catch (err) { showError("Erro ao gerar PIX."); }
    finally { dismissToast(loadingId); }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-green-100">
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
      <header className="h-20 flex items-center bg-white/80 backdrop-blur-md border-b border-zinc-50 fixed w-full top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <a href="#" className="hover:text-zinc-900 transition-colors">Como funciona</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Transportadoras</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-sm font-bold text-zinc-900 hover:opacity-70 transition-opacity px-4">Entrar</button>
            <Button className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs px-6 h-10 rounded-lg uppercase tracking-wider shadow-sm">
              CADASTRE-SE
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-[#22C55E] text-[11px] font-black uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Rastreamento em Tempo Real
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#18181B] mb-6 leading-[1.1]">
            Rastreie suas encomendas <br/>
            <span className="text-[#22C55E]">em segundos.</span>
          </h1>
          
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
            Acompanhe pedidos de qualquer transportadora em um só lugar. <br/>
            Centralize suas compras e receba alertas automáticos.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); performSearch(trackingCode); }} 
            className="max-w-3xl mx-auto mb-12 p-3 bg-white border border-zinc-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center px-6 gap-3">
              <Search className="text-zinc-300" size={20} />
              <input 
                type="text" 
                placeholder="BR0000A000BR" 
                className="w-full h-12 outline-none text-base font-bold tracking-widest text-zinc-800 placeholder:text-zinc-200" 
                value={trackingCode} 
                maxLength={12} 
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} 
              />
            </div>
            <Button type="submit" disabled={isSearching} className="bg-[#22C55E] hover:bg-[#16a34a] text-white h-14 px-10 text-sm font-black rounded-3xl transition-all shadow-md active:scale-95">
              {isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}
            </Button>
          </form>

          <div className="pt-8 flex flex-col items-center gap-6">
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Compatível com +100 transportadoras</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <img src={correiosLogo} alt="Correios" className="h-6 md:h-8 object-contain" />
              <img src={jadlogLogo} alt="Jadlog" className="h-6 md:h-8 object-contain" />
              <img src={loggiLogo} alt="Loggi" className="h-6 md:h-8 object-contain" />
              <img src={totalExpressLogo} alt="Total Express" className="h-6 md:h-8 object-contain" />
            </div>
          </div>
        </div>
      </main>

      {/* Resultado do Rastreio */}
      {showResult && (
        <section id="resultado" className="pb-24 bg-zinc-50/50">
          <div className="container mx-auto pt-20">
            <TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 bg-[#F9FAFB]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 text-orange-500 group-hover:scale-110 transition-transform">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Tempo Real</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-medium">Receba atualizações instantâneas sobre o status da sua entrega diretamente no app.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 text-blue-500 group-hover:scale-110 transition-transform">
                <Bell size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Notificações</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-medium">Fique por dentro de cada passo sem precisar atualizar a página o tempo todo.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-8 text-green-500 group-hover:scale-110 transition-transform">
                <History size={28} />
              </div>
              <h3 className="text-xl font-black mb-4">Histórico Completo</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-medium">Mantenha todos os seus pedidos anteriores salvos para consulta futura rápida.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mockup Section */}
      <section className="py-24 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-10 leading-tight">Como o RastreAR <br/> facilita sua vida</h2>
            <div className="space-y-10">
              {[
                { step: "01", title: "Insira seu código", desc: "Basta colar o código de rastreio recebido da sua loja favorita." },
                { step: "02", title: "Processamento rápido", desc: "Nossa IA identifica a transportadora e busca os dados em milissegundos." },
                { step: "03", title: "Acompanhe tudo", desc: "Veja em uma linha do tempo intuitiva onde está sua encomenda." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6 items-start group">
                  <span className="text-4xl font-black text-zinc-100 group-hover:text-green-100 transition-colors leading-none">{item.step}</span>
                  <div>
                    <h4 className="text-lg font-black mb-2">{item.title}</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative flex justify-center">
            <div className="relative z-10 w-[280px] h-[580px] bg-white rounded-[3rem] border-[8px] border-zinc-900 shadow-2xl flex flex-col items-center p-6 pt-12 overflow-hidden">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <Check size={32} />
              </div>
              <h4 className="text-xl font-black mb-1">Entrega Realizada!</h4>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest text-center mb-8">Seu pacote chegou ao destino final em <br/> Curitiba - PR.</p>
              <div className="w-full space-y-3">
                <div className="h-1.5 w-full bg-zinc-100 rounded-full"></div>
                <div className="h-1.5 w-4/5 bg-zinc-100 rounded-full"></div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full"></div>
              </div>
            </div>
            {/* Decoração atrás do celular */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-green-50 rounded-full -z-10 opacity-50 blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Planos para todos</h2>
            <p className="text-zinc-500 font-medium">Escolha o plano que melhor atende suas necessidades de rastreamento.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Gratuito */}
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 text-center flex flex-col">
              <h4 className="font-bold text-lg mb-6">Gratuito</h4>
              <div className="mb-10">
                <span className="text-4xl font-black">R$ 0</span>
              </div>
              <ul className="text-left space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Até 5 rastreios ativos</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Histórico de 30 dias</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Notificações básicas</li>
              </ul>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-100 text-zinc-900 font-black text-sm bg-zinc-50/50">Começar Agora</Button>
            </div>

            {/* Pro - Mais Popular */}
            <div className="bg-white border-2 border-green-500 rounded-[2.5rem] p-10 text-center flex flex-col relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-1.5 rounded-full shadow-lg shadow-green-500/20">Mais Popular</div>
              <h4 className="font-bold text-lg mb-6">Pro</h4>
              <div className="mb-10">
                <span className="text-4xl font-black">R$ 19,90</span>
                <span className="text-zinc-400 text-sm font-medium">/mês</span>
              </div>
              <ul className="text-left space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-700"><Check size={14} className="text-green-500" /> Rastreios ilimitados</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-700"><Check size={14} className="text-green-500" /> Histórico Vitalício</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-700"><Check size={14} className="text-green-500" /> Alertas via WhatsApp</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-700"><Check size={14} className="text-green-500" /> Prioridade de busca</li>
              </ul>
              <Button className="w-full h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-sm shadow-lg shadow-green-500/20">Assinar Pro</Button>
            </div>

            {/* Trimestral */}
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 text-center flex flex-col">
              <h4 className="font-bold text-lg mb-6">Trimestral</h4>
              <div className="mb-10">
                <span className="text-4xl font-black">R$ 49,90</span>
                <span className="text-zinc-400 text-sm font-medium">/trim</span>
              </div>
              <ul className="text-left space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Tudo do plano Pro</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Economia de R$ 9,80</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Suporte prioritário</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Alertas VIP</li>
              </ul>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-100 text-zinc-900 font-black text-sm bg-zinc-50/50">Assinar Trimestral</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Semestral */}
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 text-center flex flex-col">
              <h4 className="font-bold text-lg mb-6">Semestral</h4>
              <div className="mb-10">
                <span className="text-4xl font-black">R$ 89,90</span>
                <span className="text-zinc-400 text-sm font-medium">/sem</span>
              </div>
              <ul className="text-left space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Tudo do plano Pro</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Economia de R$ 29,50</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Suporte VIP 24/7</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Acesso antecipado</li>
              </ul>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-100 text-zinc-900 font-black text-sm bg-zinc-50/50">Assinar Semestral</Button>
            </div>

            {/* Empresarial */}
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 text-center flex flex-col">
              <h4 className="font-bold text-lg mb-6">Empresarial</h4>
              <div className="mb-10">
                <span className="text-4xl font-black">R$ 347,90</span>
                <span className="text-zinc-400 text-sm font-medium">/vitalício</span>
              </div>
              <ul className="text-left space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> API de Rastreio</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Dashboard Multi-usuário</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> Suporte 24/7</li>
                <li className="flex items-center gap-3 text-xs font-bold text-zinc-500"><Check size={14} className="text-green-500" /> White Label</li>
              </ul>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-100 text-zinc-900 font-black text-sm bg-zinc-50/50">Comprar Agora</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#18181B] text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Dúvidas comuns</h2>
            <p className="text-zinc-400 font-medium">Encontre respostas rápidas para seus problemas de entrega.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { q: "Minha encomenda não chegou", a: "Ver artigo" },
              { q: "Paguei taxa, e agora?", a: "Ver artigo" },
              { q: "Código não funciona", a: "Ver artigo" },
              { q: "Status não atualiza", a: "Ver artigo" }
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-zinc-700 transition-colors cursor-pointer group">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 text-green-500">
                  <span className="text-xs font-bold">?</span>
                </div>
                <h4 className="text-base font-bold mb-4">{faq.q}</h4>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                  {faq.a} <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="bg-[#22C55E] rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl shadow-green-500/30 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">Comece agora gratuitamente</h2>
              <p className="text-green-50 text-lg mb-12 max-w-xl mx-auto opacity-90">Crie sua conta em 30 segundos e salve todos os seus códigos de rastreio em um dashboard exclusivo.</p>
              <Button className="bg-white hover:bg-zinc-50 text-zinc-900 h-16 px-12 rounded-2xl font-black text-sm uppercase tracking-wider mb-6">Criar minha conta grátis</Button>
              <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Check size={12} /> Sem taxas ocultas. Privacidade 100% garantida.
              </p>
            </div>
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-zinc-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
            <Logo size="md" />
            <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <a href="/termos" className="hover:text-zinc-900 transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-zinc-900 transition-colors">Privacidade</a>
              <a href="/afiliados" className="hover:text-zinc-900 transition-colors">Afiliados</a>
              <a href="/suporte" className="hover:text-zinc-900 transition-colors">Suporte</a>
            </nav>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
            <p>© 2024 RastreAR Logistics. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1">Feito com <Zap size={10} className="text-orange-400" /> para uma logística inteligente.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
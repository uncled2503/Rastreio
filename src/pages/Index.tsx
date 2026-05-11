"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, Truck, Bell, History, ShieldCheck, HelpCircle, ArrowRight, PackageCheck, Zap, Check, X, Phone, CheckCircle
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
    { title: "Minha encomenda não chegou", content: "Os prazos de entrega variam de acordo com a transportadora e a modalidade de envio escolhida. Verifique o status detalhado acima." },
    { title: "Paguei taxa, e agora?", content: "Após realizar o pagamento do Despacho Postal via PIX, o sistema libera automaticamente sua encomenda em instantes." },
    { title: "Código não funciona", content: "Alguns códigos levam até 72 horas para serem postados no sistema das transportadoras após a geração da etiqueta." },
    { title: "Status não atualiza", content: "É normal o objeto ficar sem atualizações por alguns dias durante o transporte entre estados ou cidades." }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    if (value.length > 12) return;
    setTrackingCode(value);
  };

  const performSearch = async (codeToSearch: string) => {
    setIsSearching(true);
    const loadingId = showLoading("Buscando informações...");
    try {
      const { data: lead } = await supabase.from('leads').select('*').eq('codigo_rastreio', codeToSearch).maybeSingle();
      const { data: statusData } = await supabase.functions.invoke('check-pix-status', { body: { trackingCode: codeToSearch } });
      const taxaJaPaga = statusData?.taxaPaga ?? false;

      const timeline = generateTimeline(codeToSearch, lead?.cidade || "Seu endereço", lead?.estado || "", lead?.bairro || "", lead?.created_at || new Date().toISOString(), taxaJaPaga);
      setDestInfo({ 
        city: lead?.cidade || "", state: lead?.estado || "", cep: lead?.cep || "", 
        endereco: lead?.endereco || "", numero: lead?.numero || "", complemento: lead?.complemento || "", bairro: lead?.bairro || "" 
      });
      setEvents(timeline);
      setShowResult(true);
      showSuccess("Localizado!");
      setTimeout(() => document.getElementById('tracking-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      showError("Erro na busca.");
    } finally {
      dismissToast(loadingId);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.length < 12) return showError("Código inválido.");
    performSearch(trackingCode);
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

  const handleBuyPlan = async (planName: string, amount: number) => {
    if (amount === 0) return;
    const lid = showLoading("Gerando PIX...");
    try {
      const { data } = await supabase.functions.invoke('create-plan-pix', { body: { planName, amount } });
      setPlanPixData({ pixCopiaECola: data.pixCopiaECola, transactionId: data.idTransaction, planName, amount });
      setIsPlanPixModalOpen(true);
    } catch (err) { showError("Erro."); }
    finally { dismissToast(lid); }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans scroll-smooth">
      <AntiFraudModal />
      <PixModal isOpen={isPixModalOpen} onClose={() => setIsPixModalOpen(false)} pixCopiaECola={pixCopiaECola} transactionId={pixTransactionId} amount={pixAmount} onSuccess={() => performSearch(trackingCode)} />
      <PlanPixModal isOpen={isPlanPixModalOpen} onClose={() => setIsPlanPixModalOpen(false)} pixCopiaECola={planPixData.pixCopiaECola} transactionId={planPixData.transactionId} planName={planPixData.planName} amount={planPixData.amount} onSuccess={() => setIsPlanPixModalOpen(false)} />

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

      {/* Navegação */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <button className="hover:text-green-600">Como funciona</button>
            <button className="hover:text-green-600">Transportadoras</button>
            <button className="hover:text-green-600">Planos</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold">Entrar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">CADASTRE-SE</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 border border-green-100 uppercase tracking-wider">
            <Zap size={14} /> Rastreamento em Tempo Real
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 leading-[1.1]">Rastreie suas encomendas <br /> <span className="text-green-600 font-black">em segundos.</span></h1>
          <p className="text-lg text-zinc-500 mb-12 max-w-2xl mx-auto font-medium">Acompanhe pedidos de qualquer transportadora em um só lugar. <br className="hidden md:block" /> Centralize suas compras e receba alertas automáticos.</p>
          
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-20 relative">
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl relative z-10">
              <div className="flex-1 flex items-center px-4 gap-3">
                <Search className="text-zinc-400" size={24} />
                <input type="text" placeholder="BR0000A000BR" className="w-full h-14 outline-none text-lg font-mono font-bold tracking-widest" value={trackingCode} maxLength={12} onChange={handleInputChange} />
              </div>
              <Button type="submit" disabled={isSearching} className="bg-green-600 hover:bg-green-700 text-white h-14 md:h-16 px-10 text-lg font-black rounded-2xl transition-transform active:scale-95">RASTREAR AGORA</Button>
            </div>
            <div className="absolute -bottom-6 left-0 right-0 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Compatível com +100 transportadoras</div>
          </form>

          {/* Logos Transportadoras */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { src: correiosLogo, alt: "Correios" },
              { src: jadlogLogo, alt: "Jadlog" },
              { src: loggiLogo, alt: "Loggi" },
              { src: totalExpressLogo, alt: "Total Express" }
            ].map((logo, idx) => (
              <motion.img 
                key={idx}
                src={logo.src} 
                alt={logo.alt} 
                initial={{ opacity: 0.4, filter: 'grayscale(100%)' }}
                whileHover={{ opacity: 1, filter: 'grayscale(0%)', scale: 1.1 }}
                className="h-8 object-contain cursor-pointer transition-all duration-300" 
              />
            ))}
          </div>
        </motion.div>
      </section>

      <div id="tracking-result" className="scroll-mt-32">
        {showResult && <TrackingResult code={trackingCode} data={events} destInfo={destInfo} onPayTax={handlePayTax} />}
      </div>

      {/* Funcionalidades */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="text-orange-500" />, title: "Tempo Real", desc: "Receba atualizações instantâneas sobre o status da sua entrega diretamente no app." },
              { icon: <Bell className="text-blue-500" />, title: "Notificações", desc: "Fique por dentro de cada passo sem precisar atualizar a página o tempo todo." },
              { icon: <History className="text-green-500" />, title: "Histórico Completo", desc: "Mantenha todos os seus pedidos anteriores salvos para consulta futura rápida." }
            ].map((f, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona (Celular) */}
      <section className="py-24 overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-12">Como o RastreAR <br /> facilita sua vida</h2>
            <div className="space-y-10">
              {[
                { n: "01", t: "Insira seu código", d: "Basta colar o código de rastreio recebido da sua loja favorita." },
                { n: "02", t: "Processamento rápido", d: "Nossa IA identifica a transportadora e busca os dados em milissegundos." },
                { n: "03", t: "Acompanhe tudo", d: "Veja em uma linha do tempo intuitiva onde está sua encomenda." }
              ].map((s, i) => (
                <div key={i} className="flex gap-6">
                  <span className="text-3xl font-black text-zinc-100 mt-1">{s.n}</span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{s.t}</h4>
                    <p className="text-zinc-500 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-[280px] md:w-[320px] mx-auto bg-zinc-900 p-3 rounded-[3rem] shadow-2xl border-4 border-zinc-800"
            >
               <div className="bg-white rounded-[2.5rem] p-6 h-[500px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6"><CheckCircle size={32} /></div>
                  <h4 className="font-bold text-lg mb-2">Entrega Realizada!</h4>
                  <p className="text-xs text-zinc-400 mb-8 px-4">Seu pacote chegou ao destino final em Curitiba - PR.</p>
                  <div className="space-y-4 w-full">
                    {[1,2,3].map(i => <motion.div key={i} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: i * 0.2 }} className="h-2 bg-zinc-100 rounded-full" style={{ opacity: 1 - i * 0.2 }} />)}
                  </div>
               </div>
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-400/10 blur-[100px] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="container mx-auto px-4 max-w-6xl text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">Planos para todos</h2>
          <p className="text-zinc-500 font-medium">Escolha o plano que melhor atende suas necessidades de rastreamento.</p>
        </div>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { name: "Gratuito", price: "R$ 0", amount: 0, feat: ["Até 5 rastreios ativos", "Histórico de 30 dias", "Notificações básicas"] },
              { name: "Pro", price: "R$ 19,90", amount: 19.90, feat: ["Rastreios ilimitados", "Histórico Vitalício", "Alertas via WhatsApp", "Prioridade de busca"], popular: true },
              { name: "Trimestral", price: "R$ 49,90", amount: 49.90, feat: ["Tudo do plano Pro", "Economia de R$ 9,80", "Suporte prioritário", "Alertas VIP"] }
            ].map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-10 rounded-[2.5rem] bg-white border-2 relative transition-all duration-500 hover:shadow-2xl ${p.popular ? 'border-green-500 shadow-xl shadow-green-500/10' : 'border-zinc-100 shadow-sm'}`}
              >
                {p.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Mais Popular</span>}
                <h3 className="text-xl font-bold mb-4">{p.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-8">
                  <span className="text-3xl font-black">{p.price}</span>
                  {p.amount > 0 && <span className="text-zinc-400 text-xs font-bold">/mês</span>}
                </div>
                <ul className="space-y-4 mb-10 text-left">
                  {p.feat.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm text-zinc-600 font-medium">
                      <Check size={16} className="text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => handleBuyPlan(p.name, p.amount)} className={`w-full h-14 rounded-xl font-black transition-all ${p.popular ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}>
                  {p.amount === 0 ? "Começar Agora" : p.name === "Trimestral" ? "Assinar Trimestral" : "Assinar Pro"}
                </Button>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Semestral", price: "R$ 89,90", amount: 89.90, feat: ["Tudo do plano Pro", "Economia de R$ 29,50", "Suporte VIP 24/7", "Acesso antecipado"] },
              { name: "Empresarial", price: "R$ 347,90", amount: 347.90, feat: ["API de Rastreio", "Dashboard Multi-usuário", "Suporte 24/7", "White Label"] }
            ].map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 bg-white rounded-[2rem] border-2 border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-left flex-1">
                  <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black">{p.price}</span>
                    <span className="text-zinc-400 text-[10px] font-bold">/sem</span>
                  </div>
                  <ul className="space-y-2">
                    {p.feat.map((f, fi) => <li key={fi} className="flex items-center gap-2 text-xs text-zinc-500 font-medium"><Check size={12} className="text-green-500" /> {f}</li>)}
                  </ul>
                </div>
                <Button onClick={() => handleBuyPlan(p.name, p.amount)} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 h-14 px-8 rounded-xl font-black text-sm whitespace-nowrap">
                  {p.name === "Empresarial" ? "Comprar Agora" : "Assinar Semestral"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-[#111] text-white">
        <div className="container mx-auto max-w-6xl text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">Dúvidas comuns</h2>
          <p className="text-zinc-500">Encontre respostas rápidas para seus problemas de entrega.</p>
        </div>
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6">
          {faqs.map((f, i) => (
            <motion.div 
              key={i} 
              whileHover={{ scale: 1.05 }}
              className="p-8 bg-zinc-900 rounded-[2rem] border border-zinc-800 text-left group hover:border-zinc-700 transition-all cursor-pointer" 
              onClick={() => setSelectedFaq(f)}
            >
              <HelpCircle className="text-zinc-700 mb-6 group-hover:text-green-500 transition-colors" size={24} />
              <h3 className="font-bold text-lg mb-4 leading-tight">{f.title}</h3>
              <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 group-hover:text-white transition-colors">
                Ver artigo <ArrowRight size={12} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-4 bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-5xl bg-green-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-green-600/30"
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Comece agora gratuitamente</h2>
            <p className="text-green-50 mb-12 max-w-lg mx-auto font-medium">Crie sua conta em 30 segundos e salve todos os seus códigos de rastreio em um dashboard exclusivo.</p>
            <Button className="bg-white text-green-600 hover:bg-zinc-50 h-16 md:h-20 px-12 text-xl font-black rounded-2xl shadow-xl transition-transform active:scale-95">CRIAR MINHA CONTA GRÁTIS</Button>
            <p className="mt-8 text-xs font-bold text-green-900/50 flex items-center justify-center gap-2"><Check size={14} /> Sem taxas ocultas. Privacidade 100% garantida.</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
        </motion.div>
      </section>

      {/* Rodapé */}
      <footer className="py-20 border-t border-zinc-100 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-12">
            <Logo size="lg" />
            <div className="flex flex-wrap justify-center gap-8 text-xs font-black text-zinc-400 uppercase tracking-widest">
              <Link to="/termos" className="hover:text-green-600">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-green-600">Privacidade</Link>
              <Link to="/afiliados" className="hover:text-green-600">Afiliados</Link>
              <Link to="/suporte" className="hover:text-green-600">Suporte</Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-zinc-50 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
            <p>© 2024 RastreAR Logistics. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1">Feito com <Zap size={10} className="text-orange-400" /> para uma logística inteligente.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
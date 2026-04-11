"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Truck, 
  Bell, 
  History, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight,
  PackageCheck,
  Zap,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiFraudModal } from '@/components/AntiFraudModal';
import { TrackingResult } from '@/components/TrackingResult';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

// Logos de transportadoras
import correiosLogo from '@/assets/correios.png';
import jadlogLogo from '@/assets/jadlog.png';
import loggiLogo from '@/assets/loggi.png';
import totalExpressLogo from '@/assets/total-express.png';

const Index = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode || trackingCode.length < 5) {
      showError("Por favor, insira um código de rastreio válido.");
      return;
    }

    setIsSearching(true);
    const loadingId = showLoading("Buscando informações da sua encomenda...");
    
    // Simulação de delay de API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    dismissToast(loadingId);
    setIsSearching(false);
    setShowResult(true);
    showSuccess("Encomenda localizada com sucesso!");
    
    // Scroll suave para o resultado
    setTimeout(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    }, 100);
  };

  const mockEvents = [
    {
      status: "Objeto em trânsito",
      location: "Unidade de Tratamento, CAJAMAR - SP",
      date: "12/05/2024 às 14:20",
      description: "Encaminhado para Unidade de Distribuição local."
    },
    {
      status: "Objeto postado",
      location: "Agência dos Correios, CURITIBA - PR",
      date: "10/05/2024 às 09:15",
      description: "O objeto foi postado pelo remetente e está a caminho."
    }
  ];

  const carriers = [
    { name: 'Correios', logo: correiosLogo },
    { name: 'Jadlog', logo: jadlogLogo },
    { name: 'Loggi', logo: loggiLogo },
    { name: 'Total Express', logo: totalExpressLogo },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 overflow-x-hidden font-sans">
      <AntiFraudModal />
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Truck className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500">
              TRACKPRO
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <a href="#" className="hover:text-green-600 transition-colors">Como funciona</a>
            <a href="#" className="hover:text-green-600 transition-colors">Transportadoras</a>
            <a href="#" className="hover:text-green-600 transition-colors">Planos</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold text-zinc-700 hover:text-green-600">Entrar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">CADASTRE-SE</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-green-100"
          >
            <Zap size={16} />
            Rastreamento em Tempo Real
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black text-zinc-900 mb-6 leading-tight"
          >
            Rastreie suas encomendas <br className="hidden md:block" /> 
            <span className="text-green-600">em segundos.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-500 mb-12 max-w-2xl mx-auto font-medium"
          >
            Acompanhe pedidos de qualquer transportadora em um só lugar. Centralize suas compras e receba alertas automáticos.
          </motion.p>

          {/* Search Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-3xl mx-auto"
          >
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-0 bg-green-400/20 blur-2xl group-hover:bg-green-400/30 transition-all rounded-3xl" />
              <div className="relative flex flex-col md:flex-row gap-3 p-3 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <Search className="text-zinc-400 shrink-0" size={24} />
                  <input 
                    type="text" 
                    placeholder="Cole seu código de rastreio aqui..."
                    className="w-full h-14 md:h-16 outline-none text-lg font-medium text-zinc-800 placeholder:text-zinc-400"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white h-14 md:h-16 px-8 text-lg font-black rounded-2xl transition-all shadow-lg shadow-green-600/20 active:scale-[0.98]"
                >
                  {isSearching ? 'BUSCANDO...' : 'RASTREAR AGORA'}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Partners / Trust */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">Compatível com +100 transportadoras</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
              {carriers.map((carrier) => (
                <img 
                  key={carrier.name} 
                  src={carrier.logo} 
                  alt={carrier.name} 
                  className="h-8 md:h-12 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Result Section */}
      {showResult && <TrackingResult code={trackingCode} data={mockEvents} />}

      {/* Benefits Section */}
      <section className="py-24 bg-white border-y border-zinc-100 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="text-orange-500" size={32} />,
                title: "Tempo Real",
                desc: "Receba atualizações instantâneas sobre o status da sua entrega diretamente no app."
              },
              {
                icon: <Bell className="text-blue-500" size={32} />,
                title: "Notificações",
                desc: "Fique por dentro de cada passo sem precisar atualizar a página o tempo todo."
              },
              {
                icon: <History className="text-green-500" size={32} />,
                title: "Histórico Completo",
                desc: "Mantenha todos os seus pedidos anteriores salvos para consulta futura rápida."
              }
            ].map((benefit, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-[#F8FAFC] border border-zinc-50 transition-all hover:shadow-xl hover:shadow-zinc-200/50"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Como o TrackPro <br className="hidden md:block" /> facilita sua vida</h2>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Insira seu código", text: "Basta colar o código de rastreio recebido da sua loja favorita." },
                  { step: "02", title: "Processamento rápido", text: "Nossa IA identifica a transportadora e busca os dados em milissegundos." },
                  { step: "03", title: "Acompanhe tudo", text: "Veja em uma linha do tempo intuitiva onde está sua encomenda." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="text-4xl font-black text-zinc-100 group-hover:text-green-100 transition-colors">{item.step}</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-zinc-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-10 animate-pulse" />
              <div className="relative bg-zinc-900 rounded-[3rem] p-4 shadow-2xl border-8 border-zinc-800 rotate-3 transform hover:rotate-0 transition-all duration-500 max-w-[320px] mx-auto">
                 <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                   <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                     <PackageCheck className="text-green-600 mb-4" size={48} />
                     <h5 className="font-bold text-lg mb-2">Entrega Realizada!</h5>
                     <p className="text-xs text-zinc-400">Seu pacote chegou ao destino final em Curitiba - PR.</p>
                     <div className="w-full mt-8 space-y-3">
                       {[1,2,3].map(i => <div key={i} className="h-2 w-full bg-zinc-100 rounded-full" />)}
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Help Section */}
      <section className="py-24 bg-zinc-900 text-white px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Dúvidas comuns</h2>
            <p className="text-zinc-400">Encontre respostas rápidas para seus problemas de entrega.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Minha encomenda não chegou",
              "Paguei taxa, e agora?",
              "Código não funciona",
              "Status não atualiza"
            ].map((q, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer group">
                <HelpCircle className="text-green-500 mb-4" size={24} />
                <h4 className="font-bold text-lg mb-4 group-hover:text-green-400 transition-colors">{q}</h4>
                <div className="flex items-center gap-2 text-sm text-zinc-400 font-bold group-hover:translate-x-1 transition-transform">
                  Ver artigo <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl bg-gradient-to-br from-green-600 to-green-700 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-green-600/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Comece agora gratuitamente</h2>
            <p className="text-green-50 mb-10 text-lg opacity-90 max-w-xl mx-auto">
              Crie sua conta em 30 segundos e salve todos os seus códigos de rastreio em um dashboard exclusivo.
            </p>
            <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 font-black px-12 h-16 rounded-2xl text-xl transition-all shadow-xl active:scale-95">
              CRIAR MINHA CONTA GRÁTIS
            </Button>
            <p className="mt-6 text-sm text-green-100/70 flex items-center justify-center gap-2 font-medium">
              <ShieldCheck size={16} /> Sem taxas ocultas. Privacidade 100% garantida.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-zinc-100 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 border-b border-zinc-100 pb-12 mb-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Truck className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-zinc-900">
                TRACKPRO
              </span>
            </div>
            
            <div className="flex flex-wrap gap-8 text-sm font-bold text-zinc-500 uppercase tracking-widest">
              <a href="#" className="hover:text-green-600 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-green-600 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-green-600 transition-colors">Afiliados</a>
              <a href="#" className="hover:text-green-600 transition-colors">Suporte</a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-400 text-sm font-medium">
            <p>© 2024 TrackPro Logistics. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2">
              Feito com ⚡ para uma logística inteligente.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
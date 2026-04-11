"use client";

import React from 'react';
import { Truck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Truck className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter">TRACKPRO</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft size={18} /> Voltar
          </Button>
        </nav>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-zinc-100">
          <h1 className="text-3xl md:text-5xl font-black mb-8">Termos de Uso</h1>
          
          <div className="space-y-6 text-zinc-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">1. Aceitação dos Termos</h2>
              <p>Ao acessar e usar o TrackPro, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">2. Uso do Serviço</h2>
              <p>O TrackPro é uma ferramenta de rastreamento de encomendas. Os dados exibidos são coletados diretamente das transportadoras oficiais. Não nos responsabilizamos por atrasos ou informações incorretas fornecidas pelas empresas de logística.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">3. Privacidade</h2>
              <p>Seu uso do serviço também é regido por nossa Política de Privacidade. Ao usar o TrackPro, você consente com a coleta e uso de informações conforme detalhado em nossa política.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">4. Limitação de Responsabilidade</h2>
              <p>Em nenhum caso o TrackPro será responsável por quaisquer danos indiretos, incidentais ou consequenciais decorrentes do uso ou da incapacidade de usar o serviço.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
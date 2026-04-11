"use client";

import React from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const Affiliates = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center justify-between mb-12">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="md" />
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft size={18} /> Voltar
          </Button>
        </nav>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-zinc-100">
          <h1 className="text-3xl md:text-5xl font-black mb-8 text-center">Programa de Afiliados</h1>
          <p className="text-center text-zinc-500 text-lg mb-12">Ganhe dinheiro indicando a melhor plataforma de rastreio do Brasil.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: <TrendingUp className="text-green-600" />, title: "30% Comissão", desc: "Receba 30% de comissão recorrente em cada plano assinado." },
              { icon: <Users className="text-blue-600" />, title: "Tracking Fácil", desc: "Dashboard exclusivo para acompanhar seus indicados." },
              { icon: <DollarSign className="text-orange-600" />, title: "Saques Rápidos", desc: "Receba seus ganhos via PIX toda semana." }
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button className="bg-green-600 hover:bg-green-700 text-white font-black px-12 h-14 rounded-xl text-lg">
              QUERO SER AFILIADO
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Affiliates;
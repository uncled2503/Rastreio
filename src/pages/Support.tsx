"use client";

import React from 'react';
import { Truck, ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Support = () => {
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
          <h1 className="text-3xl md:text-5xl font-black mb-8">Central de Ajuda</h1>
          <p className="text-zinc-500 text-lg mb-12">Estamos aqui para ajudar com qualquer dúvida sobre seus rastreios.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-100">
              <Mail className="text-green-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">E-mail</h3>
              <p className="text-zinc-500 mb-6">Resposta em até 24 horas úteis.</p>
              <p className="font-bold text-zinc-900">suporte@trackpro.com</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-100">
              <MessageSquare className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">WhatsApp</h3>
              <p className="text-zinc-500 mb-6">Atendimento imediato das 09h às 18h.</p>
              <p className="font-bold text-zinc-900">(11) 99999-9999</p>
            </div>
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-green-50 border border-green-100">
            <h3 className="text-xl font-bold text-green-800 mb-4">Dúvida rápida?</h3>
            <p className="text-green-700 mb-6">Muitas vezes a resposta está em nossas Perguntas Frequentes na página inicial.</p>
            <Button variant="outline" onClick={() => navigate('/')} className="border-green-200 text-green-700 hover:bg-green-100">
              Ver FAQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
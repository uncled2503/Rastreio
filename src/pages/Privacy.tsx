"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const Privacy = () => {
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
          <h1 className="text-3xl md:text-5xl font-black mb-8">Política de Privacidade</h1>
          
          <div className="space-y-6 text-zinc-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">1. Coleta de Informações</h2>
              <p>Coletamos informações básicas como códigos de rastreio inseridos para facilitar consultas futuras. Não coletamos dados sensíveis sem o seu consentimento explícito.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">2. Uso de Dados</h2>
              <p>Os dados coletados são usados exclusivamente para melhorar a experiência do usuário, fornecer notificações de status e manter o histórico de rastreio.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">3. Segurança</h2>
              <p>Implementamos medidas de segurança rigorosas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">4. Cookies</h2>
              <p>Usamos cookies para lembrar suas preferências e sessões de login, garantindo uma navegação mais fluida e personalizada.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
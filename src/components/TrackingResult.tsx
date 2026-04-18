"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TrackingEvent } from '@/utils/tracking';

interface TrackingResultProps {
  code: string;
  data: TrackingEvent[];
  destCity: string;
  destState: string;
}

// Função para gerar um CEP determinístico baseado em uma string (para manter o mesmo CEP no mesmo rastreio)
const generateCEP = (seedStr: string) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const num1 = Math.abs(hash % 90000) + 10000; // 5 dígitos (10000-99999)
  const num2 = Math.abs((hash * 13) % 900) + 100; // 3 dígitos (100-999)
  return `${num1}-${num2}`;
};

export const TrackingResult = ({ code, data, destCity, destState }: TrackingResultProps) => {
  if (!data || data.length === 0) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'package': return <Package size={18} />;
      case 'truck': return <Truck size={18} />;
      case 'check': return <CheckCircle size={18} />;
      default: return <Package size={18} />;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ' às');
  };

  const isDelivered = data[0]?.icon === 'check';
  
  // Como os dados vêm reversos, a origem é o último item do array.
  const originFullString = data[data.length - 1]?.location || 'São Paulo / SP';
  const originParts = originFullString.split(' - ');
  const originStr = originParts.length > 1 ? originParts[1] : originFullString;

  // Calculando strings reais que vão aparecer na tela de Destino (para remover barras vazias)
  const destString = destCity ? `${destCity}${destState ? ` / ${destState}` : ''}` : 'Endereço do Destinatário';

  // Gerando os CEPs
  const originCEP = generateCEP(originStr + code);
  const destCEP = generateCEP(destCity + destState + code);

  // Calculando o progresso para a barra animada (entre 15% e 100%)
  const progressPct = isDelivered ? 100 : Math.min(15 + (data.length * 10), 85);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto mt-12 px-4"
    >
      <Card className={`p-6 sm:p-8 rounded-3xl border-2 shadow-xl overflow-hidden ${isDelivered ? 'border-green-100 shadow-green-100/50' : 'border-blue-100 shadow-blue-100/50'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-zinc-100 pb-6">
          <div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${isDelivered ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'}`}>
              {isDelivered ? 'Objeto Entregue' : 'Objeto em Trânsito'}
            </span>
            <h3 className="text-2xl font-bold mt-2 text-zinc-900">{code}</h3>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Clock size={16} />
            <span>Última atualização: {formatDate(data[0].date)}</span>
          </div>
        </div>

        {/* --- BARRA DE TRAJETO VISUAL --- */}
        <div className="my-10 bg-zinc-50/50 rounded-2xl p-6 border border-zinc-100">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            <span>Origem</span>
            <span>Destino</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 relative">
            {/* Ícone Origem */}
            <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center z-10 border-4 border-white ${isDelivered ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              <Package size={20} />
            </div>
            
            {/* Linha de Progresso */}
            <div className="flex-1 relative h-2 bg-zinc-200 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPct}%` }}
                 transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                 className={`absolute left-0 top-0 h-full rounded-full ${isDelivered ? 'bg-green-500' : 'bg-blue-500'}`}
               />
            </div>
            
            {/* Ícone Destino */}
            <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center z-10 border-4 border-white transition-colors duration-500 ${isDelivered ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'}`}>
              <MapPin size={20} />
            </div>

            {/* Caminhãozinho animado seguindo o progresso */}
            <motion.div 
              initial={{ left: '0%' }}
              animate={{ left: `calc(${progressPct}% - 14px)` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white p-1 rounded-full shadow-sm ${isDelivered ? 'text-green-500' : 'text-blue-500'}`}
            >
              <Truck size={18} className={!isDelivered ? 'animate-pulse' : ''} />
            </motion.div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 px-1 gap-4">
            <div className="text-left">
              <p className="text-sm font-bold text-zinc-800">{originStr}</p>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">CEP: {originCEP}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-800">{destString}</p>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">CEP: {destCEP}</p>
            </div>
          </div>
        </div>
        {/* ------------------------------- */}

        <div className="relative space-y-8">
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-100" />

          {data.map((event, index) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-12"
            >
              <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                index === 0 
                  ? (isDelivered ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-blue-600 text-white shadow-lg shadow-blue-200') 
                  : 'bg-white border-2 border-zinc-200 text-zinc-400'
              }`}>
                {getIcon(event.icon)}
              </div>
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {formatDate(event.date)}
                </p>
                <h4 className={`text-lg font-bold ${index === 0 ? (isDelivered ? 'text-green-600' : 'text-blue-600') : 'text-zinc-800'}`}>
                  {event.status}
                </h4>
                
                <div className="flex flex-col gap-1.5 text-zinc-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="shrink-0" />
                    <span className="text-sm font-medium">{event.location}</span>
                  </div>
                  
                  {event.destination && (
                    <div className="flex items-center gap-1.5 text-blue-600 mt-1">
                      <Truck size={14} className="shrink-0" />
                      <span className="text-sm bg-blue-50 px-2 py-0.5 rounded font-medium">
                        Destino: {event.destination}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className={`mt-12 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 ${isDelivered ? 'bg-zinc-900' : 'bg-blue-600'}`}>
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-lg">Quer receber notificações?</h4>
            <p className="opacity-90 text-sm">Avisamos você por e-mail a cada movimentação.</p>
          </div>
          <button className={`font-bold px-6 py-3 rounded-xl transition-colors shrink-0 ${isDelivered ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
            Ativar Notificações
          </button>
        </div>
      </Card>
    </motion.div>
  );
};
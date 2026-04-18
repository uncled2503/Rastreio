"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, MapPin, CheckCircle, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TrackingEvent } from '@/utils/tracking';
import { Button } from '@/components/ui/button';

interface TrackingResultProps {
  code: string;
  data: TrackingEvent[];
  destInfo: {
    city: string;
    state: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
  };
  onPayTax: () => void;
}

const generateCEP = (seedStr: string) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const num1 = Math.abs(hash % 90000) + 10000;
  const num2 = Math.abs((hash * 13) % 900) + 100;
  return `${num1}-${num2}`;
};

export const TrackingResult = ({ code, data, destInfo, onPayTax }: TrackingResultProps) => {
  if (!data || data.length === 0) return null;

  const { city, state, cep, endereco, numero, complemento, bairro } = destInfo;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'package': return <Package size={18} />;
      case 'truck': return <Truck size={18} />;
      case 'check': return <CheckCircle size={18} />;
      case 'alert': return <ShieldAlert size={18} />;
      case 'shield': return <ShieldCheck size={18} />;
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
    }).replace(',', ' às ');
  };

  const isDelivered = data[0]?.icon === 'check';
  const isConfiscated = data[0]?.icon === 'alert';
  
  const originFullString = data[data.length - 1]?.location || 'São Paulo / SP';
  const originParts = originFullString.split(' - ');
  const originStr = originParts.length > 1 ? originParts[1] : originFullString;

  const destString = city ? `${city}${state ? ` / ${state}` : ''}` : 'Seu endereço';
  const originCEP = generateCEP(originStr + code);
  const destCEP = cep || generateCEP(city + state + code);

  const progressPct = isDelivered ? 100 : isConfiscated ? Math.min(15 + (data.length * 10), 60) : Math.min(15 + (data.length * 10), 85);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto mt-12 px-4"
    >
      <Card className={`p-6 sm:p-8 rounded-3xl border-2 shadow-xl overflow-hidden ${
        isDelivered ? 'border-green-100 shadow-green-100/50' : 
        isConfiscated ? 'border-red-200 shadow-red-100/50' : 
        'border-blue-100 shadow-blue-100/50'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-zinc-100 pb-6">
          <div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              isDelivered ? 'text-green-600 bg-green-50' : 
              isConfiscated ? 'text-red-600 bg-red-50' : 
              'text-blue-600 bg-blue-50'
            }`}>
              {isDelivered ? 'Objeto Entregue' : isConfiscated ? 'Ação Necessária' : 'Objeto em Trânsito'}
            </span>
            <h3 className="text-2xl font-bold mt-2 text-zinc-900">{code}</h3>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Clock size={16} />
            <span>Última atualização: {formatDate(data[0].date)}</span>
          </div>
        </div>

        {/* ALERTA DE CONFISCO COM BOTÃO DE PAGAMENTO */}
        {isConfiscated && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 bg-red-50 border-2 border-red-200 rounded-3xl p-6 sm:p-8 text-center shadow-lg shadow-red-100/50"
          >
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <ShieldAlert size={40} />
            </div>
            <h4 className="text-2xl font-black text-red-700 mb-2">Aguardando Pagamento</h4>
            <p className="text-red-600 font-medium mb-6 max-w-lg mx-auto leading-relaxed">
              Sua encomenda encontra-se retida na fiscalização aduaneira. Para que a entrega siga seu trajeto normalmente, é necessário efetuar o pagamento do <strong>despacho postal</strong> no valor de R$ 14,90.
            </p>
            <Button 
              onClick={onPayTax} 
              className="bg-red-600 hover:bg-red-700 text-white font-black px-10 h-16 rounded-2xl text-lg w-full sm:w-auto transition-all shadow-xl shadow-red-600/30 active:scale-95 animate-pulse"
            >
              LIBERAR ENCOMENDA
            </Button>
          </motion.div>
        )}

        <div className="my-10 bg-zinc-50/50 rounded-2xl p-6 border border-zinc-100">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            <span>Origem</span>
            <span>Destino</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 relative">
            <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center z-10 border-4 border-white ${isDelivered ? 'bg-green-100 text-green-600' : isConfiscated ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <Package size={20} />
            </div>
            
            <div className="flex-1 relative h-2 bg-zinc-200 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPct}%` }}
                 transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                 className={`absolute left-0 top-0 h-full rounded-full ${isDelivered ? 'bg-green-500' : isConfiscated ? 'bg-red-500' : 'bg-blue-500'}`}
               />
            </div>
            
            <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center z-10 border-4 border-white transition-colors duration-500 ${isDelivered ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'}`}>
              <MapPin size={20} />
            </div>

            <motion.div 
              initial={{ left: '0%' }}
              animate={{ left: `calc(${progressPct}% - 14px)` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white p-1 rounded-full shadow-sm ${isDelivered ? 'text-green-500' : isConfiscated ? 'text-red-500' : 'text-blue-500'}`}
            >
              {isConfiscated ? <ShieldAlert size={18} /> : <Truck size={18} className={!isDelivered ? 'animate-pulse' : ''} />}
            </motion.div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mt-4 px-1 gap-4">
            <div className="text-left sm:w-1/2">
              <p className="text-sm font-bold text-zinc-800">{originStr}</p>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">CEP: {originCEP}</p>
            </div>
            <div className="text-right sm:w-1/2">
              <p className="text-sm font-bold text-zinc-800">{destString}</p>
              {endereco && (
                <p className="text-xs text-zinc-500 mt-1">
                  {endereco}{numero ? `, ${numero}` : ''}
                  {complemento ? ` - ${complemento}` : ''}
                </p>
              )}
              {bairro && <p className="text-xs text-zinc-500 mt-0.5">{bairro}</p>}
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">CEP: {destCEP}</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
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
                  ? (isDelivered ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 
                     isConfiscated ? 'bg-red-600 text-white shadow-lg shadow-red-200' :
                     'bg-blue-600 text-white shadow-lg shadow-blue-200') 
                  : 'bg-white border-2 border-zinc-200 text-zinc-400'
              }`}>
                {getIcon(event.icon)}
              </div>
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {formatDate(event.date)}
                </p>
                <h4 className={`text-lg font-bold ${
                  index === 0 ? 
                  (isDelivered ? 'text-green-600' : isConfiscated ? 'text-red-600' : 'text-blue-600') : 
                  'text-zinc-800'
                }`}>
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
      </Card>
    </motion.div>
  );
};
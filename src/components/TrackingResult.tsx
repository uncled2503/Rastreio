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
  destInfo: any;
  onPayTax: () => void;
}

export const TrackingResult = ({ code, data, destInfo, onPayTax }: TrackingResultProps) => {
  if (!data || data.length === 0) return null;

  const currentEvent = data[0];
  const isActionRequired = currentEvent.icon === 'alert';
  const taxAmount = currentEvent.taxAmount || 19.90;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto px-4">
      <Card className={`p-6 sm:p-8 rounded-[2.5rem] border-2 shadow-2xl ${isActionRequired ? 'border-red-100 bg-white' : 'border-zinc-100'}`}>
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-50">
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isActionRequired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {isActionRequired ? 'Ação Necessária' : 'Encomenda em Rota'}
            </span>
            <h3 className="text-3xl font-black mt-2 text-zinc-900">{code}</h3>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Última atualização</p>
            <p className="text-sm font-bold text-zinc-800">{new Date(currentEvent.date).toLocaleDateString('pt-BR')} às {new Date(currentEvent.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {isActionRequired && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="mb-10 bg-red-50 rounded-[2rem] p-8 text-center border-2 border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert size={32} /></div>
            <h4 className="text-xl font-black text-red-700 mb-2">Aguardando Pagamento</h4>
            <p className="text-red-600 text-sm font-medium mb-6 leading-relaxed">
              {taxAmount === 19.90 
                ? "Sua encomenda está retida em Curitiba para o pagamento do Despacho Postal. Efetue o pagamento para liberar o transporte."
                : "Objeto chegou na cidade de destino, mas requer o pagamento da Taxa de Manuseio Logístico para sair para entrega."
              }
            </p>
            <Button onClick={onPayTax} className="bg-red-600 hover:bg-red-700 text-white font-black px-12 h-14 rounded-xl text-lg w-full sm:w-auto shadow-xl shadow-red-600/20 active:scale-95">
              PAGAR R$ {taxAmount.toFixed(2).replace('.', ',')} VIA PIX
            </Button>
          </motion.div>
        )}

        <div className="space-y-8 relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-50" />
          {data.map((event, i) => (
            <div key={event.id} className="relative pl-12">
              <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white ${i === 0 ? (event.icon === 'alert' ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-zinc-100 text-zinc-400'}`}>
                {event.icon === 'package' && <Package size={16} />}
                {event.icon === 'truck' && <Truck size={16} />}
                {event.icon === 'check' && <CheckCircle size={16} />}
                {event.icon === 'alert' && <ShieldAlert size={16} />}
                {event.icon === 'shield' && <ShieldCheck size={16} />}
              </div>
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">{new Date(event.date).toLocaleDateString('pt-BR')} - {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              <h4 className={`text-lg font-bold ${i === 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>{event.status}</h4>
              <p className="text-xs font-bold text-zinc-400 mt-1 flex items-center gap-1"><MapPin size={12} /> {event.location} {event.destination && `→ ${event.destination}`}</p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
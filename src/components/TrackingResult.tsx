"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TrackingEvent } from '@/utils/tracking';

interface TrackingResultProps {
  code: string;
  data: TrackingEvent[];
}

export const TrackingResult = ({ code, data }: TrackingResultProps) => {
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
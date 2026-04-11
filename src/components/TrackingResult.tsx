"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TrackingEvent {
  status: string;
  location: string;
  date: string;
  description: string;
}

interface TrackingResultProps {
  code: string;
  data: TrackingEvent[];
}

export const TrackingResult = ({ code, data }: TrackingResultProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto mt-12 px-4"
    >
      <Card className="p-6 sm:p-8 rounded-3xl border-2 border-blue-100 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-zinc-100 pb-6">
          <div>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Objeto Encontrado
            </span>
            <h3 className="text-2xl font-bold mt-2 text-zinc-900">{code}</h3>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Clock size={16} />
            <span>Última atualização: Hoje, 14:20</span>
          </div>
        </div>

        <div className="relative space-y-8">
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-100" />

          {data.map((event, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-12"
            >
              <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                index === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-zinc-200 text-zinc-400'
              }`}>
                {index === 0 ? <Truck size={18} /> : <Package size={18} />}
              </div>
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {event.date}
                </p>
                <h4 className={`text-lg font-bold ${index === 0 ? 'text-blue-600' : 'text-zinc-800'}`}>
                  {event.status}
                </h4>
                <div className="flex items-center gap-1.5 text-zinc-500 mt-1">
                  <MapPin size={14} />
                  <span className="text-sm">{event.location}</span>
                </div>
                <p className="text-sm text-zinc-600 mt-2 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  {event.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-600 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-lg">Quer receber notificações?</h4>
            <p className="text-blue-50 opacity-90 text-sm">Avisamos você por e-mail a cada movimentação.</p>
          </div>
          <button className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shrink-0">
            Ativar Notificações
          </button>
        </div>
      </Card>
    </motion.div>
  );
};
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCopiaECola: string;
  transactionId: string;
  onSuccess: () => void;
  amount?: number;
  title?: string;
}

export const PixModal = ({ isOpen, onClose, pixCopiaECola, transactionId, onSuccess, amount = 15.90, title = "Taxa de Despacho" }: PixModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !transactionId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-pix-status', { body: { transactionId } });
        if (data && (data.status === 'approved' || data.status === 'paid')) {
          showSuccess("Pagamento confirmado!");
          onSuccess();
        }
      } catch (err) { console.error(err); }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, transactionId, onSuccess]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="bg-red-600 p-6 text-center text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"><X size={20} /></button>
              <ShieldAlert className="mx-auto mb-2" size={40} />
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="opacity-90">Pague via PIX para liberar sua encomenda</p>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center"><QRCodeSVG value={pixCopiaECola} size={200} /></div>
              <div className="flex justify-between items-center text-lg font-black bg-zinc-50 p-4 rounded-xl">
                <span>Valor:</span>
                <span className="text-red-600">R$ {amount.toFixed(2).replace('.', ',')}</span>
              </div>
              <Button onClick={() => { navigator.clipboard.writeText(pixCopiaECola); setCopied(true); setTimeout(() => setCopied(false), 2000); }} variant="outline" className="w-full h-14 font-bold border-2">
                {copied ? <Check size={18} className="text-green-500 mr-2"/> : <Copy size={18} className="mr-2"/>}
                {copied ? 'COPIADO!' : 'COPIAR CÓDIGO PIX'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
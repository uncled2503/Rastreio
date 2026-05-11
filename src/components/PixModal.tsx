"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, ShieldAlert, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCopiaECola: string;
  transactionId: string;
  onSuccess: () => void;
  amount?: number;
  title?: string;
}

export const PixModal = ({ isOpen, onClose, pixCopiaECola, transactionId, onSuccess, amount = 19.90, title = "Taxa de Despacho" }: PixModalProps) => {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!isOpen || !transactionId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-pix-status', { body: { transactionId } });
        if (data && (data.status === 'approved' || data.status === 'paid')) {
          showSuccess("Pagamento confirmado com sucesso!");
          onSuccess();
        }
      } catch (err) { console.error(err); }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, transactionId, onSuccess]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const { error } = await supabase.functions.invoke('force-approve-pix', {
        body: { transactionId }
      });
      if (error) throw error;
      showSuccess("Simulação: Pagamento aprovado!");
    } catch (err) {
      showError("Erro ao simular pagamento.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl relative border border-zinc-100"
          >
            <div className="bg-red-600 p-6 text-center text-white relative">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <ShieldAlert className="mx-auto mb-2" size={40} />
              <h3 className="text-xl font-black">{title}</h3>
              <p className="opacity-90 font-medium text-sm">Pague via PIX para liberar sua encomenda</p>
            </div>

            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-zinc-100 rounded-3xl shadow-inner">
                  <QRCodeSVG value={pixCopiaECola} size={200} />
                </div>
              </div>

              <div className="flex justify-between items-center text-xl font-black bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                <span className="text-zinc-500 text-sm uppercase tracking-wider">Valor:</span>
                <span className="text-red-600">R$ {amount.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => { 
                    navigator.clipboard.writeText(pixCopiaECola); 
                    setCopied(true); 
                    setTimeout(() => setCopied(false), 2000); 
                  }} 
                  variant="outline" 
                  className="w-full h-14 font-bold border-2 border-zinc-200 hover:bg-zinc-50 rounded-xl"
                >
                  {copied ? <Check size={18} className="text-green-500 mr-2"/> : <Copy size={18} className="mr-2 text-zinc-400"/>}
                  {copied ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
                </Button>

                {/* BOTÃO DE SIMULAÇÃO - APENAS PARA TESTE */}
                <Button 
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full h-12 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <FlaskConical size={16} />
                  {isSimulating ? 'SIMULANDO...' : 'SIMULAR PAGAMENTO (TESTE)'}
                </Button>
              </div>

              <p className="text-xs text-zinc-400 font-medium">
                Após o pagamento, o sistema detectará automaticamente em alguns segundos.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
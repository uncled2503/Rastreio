"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface PlanPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCopiaECola: string;
  transactionId: string;
  planName: string;
  amount: number;
  onSuccess: () => void;
}

export const PlanPixModal = ({ isOpen, onClose, pixCopiaECola, transactionId, planName, amount, onSuccess }: PlanPixModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !transactionId) return;

    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-pix-status', {
          body: { transactionId }
        });

        if (!error && data && (data.status === 'approved' || data.status === 'paid')) {
          showSuccess("Pagamento confirmado! Bem-vindo ao novo plano.");
          onSuccess();
        }
      } catch (err) {
        console.error("Erro:", err);
      }
    };

    const interval = setInterval(checkPayment, 3000); 
    return () => clearInterval(interval);
  }, [isOpen, transactionId, onSuccess]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    const toastId = showLoading("Forçando aprovação via sistema...");
    try {
      await supabase.functions.invoke('force-approve-pix', {
        body: { transactionId }
      });
      dismissToast(toastId);
    } catch (err) {
      dismissToast(toastId);
      showError("Erro ao simular pagamento");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative"
          >
            <div className="bg-green-600 p-6 text-center text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <ShieldCheck className="mx-auto mb-3" size={40} />
              <h3 className="text-xl font-bold">Assinatura: {planName}</h3>
              <p className="opacity-90 mt-1">Pague via PIX para liberar seu acesso</p>
            </div>

            <div className="p-6 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-3 bg-white border-4 border-zinc-100 rounded-2xl shadow-sm">
                  <QRCodeSVG value={pixCopiaECola} size={200} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-zinc-500 mb-1 px-1">
                  <span>Valor:</span>
                  <span className="text-lg font-black text-green-600">
                    R$ {amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <Button 
                  onClick={handleCopy}
                  variant="outline" 
                  className="w-full h-12 text-sm font-bold flex items-center gap-2 border-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  {copied ? <Check className="text-green-500" size={18} /> : <Copy size={18} />}
                  {copied ? 'CÓDIGO COPIADO' : 'COPIAR CÓDIGO PIX'}
                </Button>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
                
                <button 
                  onClick={handleSimulatePayment}
                  className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-full mt-2 transition-colors"
                >
                  <Zap size={12} /> Simular Pagamento (Dev)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCopiaECola: string;
  trackingCode: string;
  onSuccess: () => void;
}

export const PixModal = ({ isOpen, onClose, pixCopiaECola, trackingCode, onSuccess }: PixModalProps) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Polling para verificar se o pagamento foi aprovado (webhook da Royal Banking vai atualizar o banco)
  useEffect(() => {
    if (!isOpen) return;

    const checkPayment = async () => {
      const { data } = await supabase
        .from('pix_gateway_payments')
        .select('status')
        .eq('id_transaction', `tax_${trackingCode}`)
        .maybeSingle();

      if (data && (data.status === 'approved' || data.status === 'paid')) {
        showSuccess("Pagamento confirmado com sucesso!");
        onSuccess();
      }
    };

    const interval = setInterval(checkPayment, 3000); // Checa a cada 3 segundos
    return () => clearInterval(interval);
  }, [isOpen, trackingCode, onSuccess]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="bg-red-600 p-6 text-center text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <ShieldAlert className="mx-auto mb-3" size={40} />
              <h3 className="text-xl font-bold">Taxa de Despacho Postal</h3>
              <p className="opacity-90 mt-1">Pague via PIX para liberar sua encomenda</p>
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
                  <span className="text-lg font-black text-zinc-900">R$ 14,90</span>
                </div>
                
                <Button 
                  onClick={handleCopy}
                  variant="outline" 
                  className="w-full h-12 text-sm font-bold flex items-center gap-2 border-2"
                >
                  {copied ? <Check className="text-green-500" size={18} /> : <Copy size={18} />}
                  {copied ? 'CÓDIGO COPIADO' : 'COPIAR CÓDIGO PIX'}
                </Button>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
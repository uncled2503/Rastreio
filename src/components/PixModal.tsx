"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCopiaECola: string;
  transactionId: string;
  amount: number;
  title?: string;
  onSuccess: () => void;
}

export const PixModal = ({ isOpen, onClose, pixCopiaECola, transactionId, amount, title = "Taxa de Despacho Postal", onSuccess }: PixModalProps) => {
  const [copied, setCopied] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const isChecking = useRef(false);
  const MAX_ATTEMPTS = 600; // 30 minutos

  const checkPayment = async (isManual = false) => {
    if (isChecking.current && !isManual) return;
    if (isManual) setIsVerifying(true);
    isChecking.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('check-pix-status', {
        body: { transactionId }
      });

      if (!error && data && (data.status === 'paid' || data.status === 'approved' || data.status === 'success')) {
        showSuccess("Pagamento confirmado com sucesso!");
        onSuccess();
        return true;
      }
      
      if (isManual && data?.status === 'pending') {
        showError("O banco ainda não confirmou o recebimento. Aguarde uns instantes.");
      }
      
      setAttempts(prev => prev + 1);
      return false;
    } catch (err) {
      console.error("Erro ao checar status do PIX:", err);
      return false;
    } finally {
      isChecking.current = false;
      if (isManual) setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !transactionId || attempts >= MAX_ATTEMPTS) return;

    checkPayment();
    const interval = setInterval(() => checkPayment(), 4000);
    return () => clearInterval(interval);
  }, [isOpen, transactionId]);

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
              <h3 className="text-xl font-bold">{title}</h3>
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
                  <span className="text-lg font-black text-zinc-900">
                    R$ {amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <Button 
                  onClick={handleCopy}
                  variant="outline" 
                  className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 border-2 border-zinc-200"
                >
                  {copied ? <Check className="text-green-500" size={18} /> : <Copy size={18} />}
                  {copied ? 'CÓDIGO COPIADO' : 'COPIAR CÓDIGO PIX'}
                </Button>

                <Button
                  onClick={() => checkPayment(true)}
                  disabled={isVerifying}
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-zinc-600 text-xs flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={isVerifying ? "animate-spin" : ""} />
                  {isVerifying ? "VERIFICANDO..." : "JÁ PAGUEI, VERIFICAR AGORA"}
                </Button>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
                  {attempts < MAX_ATTEMPTS ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      Aguardando confirmação do banco...
                    </>
                  ) : (
                    <span className="text-red-500 font-bold">Tempo expirado. Gere um novo código.</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-300 font-mono select-all">ID: {transactionId}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AntiFraudModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenAntiFraudModal');
    if (!hasSeenModal) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenAntiFraudModal', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="relative p-6 sm:p-8">
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} className="text-zinc-500" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                  <ShieldAlert className="text-red-600 dark:text-red-400" size={32} />
                </div>
                
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  Não caia em golpes de rastreio!
                </h2>
                
                <p className="text-zinc-600 dark:text-zinc-400">
                  Sua segurança é nossa prioridade. Fique atento às seguintes diretrizes:
                </p>

                <div className="w-full space-y-3 text-left bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  {[
                    "Confira sempre se o link acessado é o oficial da nossa plataforma",
                    "Não solicitamos downloads de aplicativos suspeitos por SMS",
                    "Proteja seus dados e nunca compartilhe senhas de acesso"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleClose}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 text-base font-semibold transition-all shadow-lg shadow-green-600/20"
                >
                  Entendi, desejo continuar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
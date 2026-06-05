import React from 'react';
import { Crown, Lock, CheckCircle2 } from 'lucide-react';

export default function ProView({ isPremium, onPurchase, onRestore }: { isPremium: boolean, onPurchase: () => void, onRestore: () => void }) {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24 animate-in fade-in duration-300 p-5">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Crown className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4">
            {isPremium ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPremium ? 'STATUS: PRO' : 'STATUS: PERCUMA'}
          </div>
          <h2 className="text-2xl font-bold mb-2">Kalkulator PRO</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {isPremium 
              ? 'Terima kasih! Anda kini mempunyai akses penuh kepada semua ciri termasuk Kamera Automatik.' 
              : 'Naik taraf untuk membuka kunci Kamera Automatik dan kiraan ralat tanpa had.'}
          </p>
          
          {!isPremium && (
            <button 
              onClick={onPurchase}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" /> Beli Sekarang - RM 4.90
            </button>
          )}
        </div>
      </div>

      {!isPremium && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Kelebihan PRO</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Buka kunci <strong>Kamera Automatik</strong> untuk pengesanan kelipan pintar.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Kiraan ralat tanpa had dan lebih pantas.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Sokong pembangun untuk kemaskini masa hadapan.</span>
            </li>
          </ul>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button onClick={onRestore} className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Pulihkan Pembelian (Restore)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

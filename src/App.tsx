import React, { useState } from 'react';
import { Timer, Camera, Crown, Zap, X } from 'lucide-react';
import CameraView from './components/CameraView';
import ManualView from './components/ManualView';
import ProView from './components/ProView';

// ==========================================
// MAIN APP SHELL (BOTTOM NAV)
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'pro'>('manual');
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('isPremium') === 'true';
  });
  const [showPaywallSheet, setShowPaywallSheet] = useState(false);

  const handlePurchase = () => {
    localStorage.setItem('isPremium', 'true');
    setIsPremium(true);
    setShowPaywallSheet(false);
    setActiveTab('camera');
  };

  const handleRestore = () => {
    localStorage.setItem('isPremium', 'true');
    setIsPremium(true);
    alert("Pembelian berjaya dipulihkan!");
  };

  const handleTabClick = (tab: 'camera' | 'manual' | 'pro') => {
    if (tab === 'camera' && !isPremium) {
      setShowPaywallSheet(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex flex-col font-sans overflow-hidden selection:bg-blue-200">
      {/* Top App Bar */}
      <header className="flex-none h-14 bg-white border-b border-slate-200 flex items-center justify-center px-4 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Kalkulator Meter</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'camera' && <CameraView />}
        {activeTab === 'manual' && <ManualView />}
        {activeTab === 'pro' && <ProView isPremium={isPremium} onPurchase={handlePurchase} onRestore={handleRestore} />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="flex-none h-16 bg-white border-t border-slate-200 flex justify-around items-center px-2 pb-safe z-30">
        <button 
          onClick={() => handleTabClick('manual')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'manual' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Timer className={`w-6 h-6 ${activeTab === 'manual' ? 'fill-blue-50' : ''}`} />
          <span className="text-[10px] font-medium">Manual</span>
        </button>
        
        <button 
          onClick={() => handleTabClick('camera')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${activeTab === 'camera' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {!isPremium && <div className="absolute top-1 right-6 w-2 h-2 bg-amber-500 rounded-full border border-white"></div>}
          <Camera className={`w-6 h-6 ${activeTab === 'camera' ? 'fill-blue-50' : ''}`} />
          <span className="text-[10px] font-medium">Kamera</span>
        </button>
        
        <button 
          onClick={() => handleTabClick('pro')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'pro' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Crown className={`w-6 h-6 ${activeTab === 'pro' ? 'fill-blue-50' : ''}`} />
          <span className="text-[10px] font-medium">PRO</span>
        </button>
      </nav>

      {/* Paywall Bottom Sheet */}
      {showPaywallSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPaywallSheet(false)}></div>
          <div className="bg-white rounded-t-3xl w-full max-w-md mx-auto relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            <button onClick={() => setShowPaywallSheet(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 pt-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Kunci Kamera Automatik</h2>
              <p className="text-slate-500 text-sm mb-6">Naik taraf ke PRO untuk menggunakan pengesanan kelipan kamera pintar dan jimatkan masa anda.</p>
              
              <button 
                onClick={handlePurchase}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl transition-transform active:scale-95 shadow-lg shadow-slate-900/20 mb-3"
              >
                Beli Sekarang - RM 4.90
              </button>
              <button 
                onClick={() => setShowPaywallSheet(false)}
                className="w-full bg-slate-100 text-slate-600 font-medium py-3 px-6 rounded-xl transition-colors active:bg-slate-200"
              >
                Mungkin Nanti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';

export default function ManualView() {
  // Semua state bermula dengan kosong ('')
  const [pf, setPf] = useState<number | ''>('');
  const [konstan, setKonstan] = useState<number | ''>('');
  const [amp, setAmp] = useState<number | ''>('');
  const [referenceTime, setReferenceTime] = useState<number | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number>(0);
  const [errorResult, setErrorResult] = useState<{ error: number, actual: number } | null>(null);

  // Logik Pengiraan Teori
  const hitungTeori = () => {
    const p = Number(pf);
    const c = Number(konstan);
    const a = Number(amp);

    // Memastikan semua input diisi dan lebih besar dari 0
    if (!p || p <= 0 || !c || c <= 0 || !a || a <= 0) return null;
    return 15000 / (p * c * a);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggleAction = () => {
    if (!isRunning) {
      const ref = hitungTeori();
      if (ref === null) {
        alert("Sila isi semua maklumat (PF, Konstan, & Amp) sebelum mula.");
        return;
      }
      setReferenceTime(ref);
      setErrorResult(null); 
      setElapsed(0); 
      startTimeRef.current = Date.now();
      setIsRunning(true);
    } else {
      setIsRunning(false);
      const finalElapsed = Date.now() - startTimeRef.current;
      setElapsed(finalElapsed);

      if (referenceTime) {
        const actualSeconds = finalElapsed / 1000;
        const err = ((referenceTime - actualSeconds) / actualSeconds) * 100;
        setErrorResult({ error: err, actual: actualSeconds });
      }
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24">
      
      {/* BAHAGIAN ATAS: Kad Masa/Ralat (Telah dikecilkan) */}
      <div className="py-6 px-6 flex flex-col items-center justify-center bg-white shadow-sm border-b border-slate-100">
        {!errorResult ? (
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Masa Semasa</span>
            {/* Saiz dikecilkan dari text-7xl ke text-5xl */}
            <span className="text-5xl font-light tabular-nums tracking-tight text-slate-900">
              {formatTime(elapsed)}
            </span>
          </div>
        ) : (
          /* Kad ralat juga dikecilkan saiz dan paddingnya */
          <div className={`w-full max-w-xs p-4 rounded-2xl border text-center transition-all animate-in zoom-in duration-300 ${Math.abs(errorResult.error) > 2 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
             <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${Math.abs(errorResult.error) > 2 ? 'text-red-700' : 'text-emerald-700'}`}>
              Keputusan Ralat
            </p>
            {/* Saiz dikecilkan dari text-6xl ke text-4xl */}
            <p className={`text-4xl font-black tracking-tighter mb-3 ${Math.abs(errorResult.error) > 2 ? 'text-red-600' : 'text-emerald-600'}`}>
              {errorResult.error > 0 ? '+' : ''}{errorResult.error.toFixed(2)}%
            </p>
            <div className="flex justify-around text-xs font-semibold text-slate-500 border-t border-black/5 pt-3">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase opacity-60">Sebenar</span>
                <span>{errorResult.actual.toFixed(3)}s</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase opacity-60">Teori</span>
                <span>{referenceTime?.toFixed(3)}s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Konfigurasi Ujian</h3>
          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm border border-slate-100">
            
            {/* Input Power Factor */}
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium text-slate-700">Power Factor (pf)</span>
              <input 
                type="number" 
                inputMode="decimal"
                value={pf} 
                onChange={(e) => setPf(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                placeholder="cth: 1.0"
                className="text-right bg-transparent outline-none text-blue-600 font-bold w-24 placeholder:text-slate-300" 
              />
            </div>

            {/* Input Konstan */}
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium text-slate-700">Konstan (C)</span>
              <input 
                type="number" 
                inputMode="numeric"
                value={konstan} 
                onChange={(e) => setKonstan(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                placeholder="cth: 300"
                className="text-right bg-transparent outline-none text-blue-600 font-bold w-24 placeholder:text-slate-300" 
              />
            </div>

            {/* Input Amp */}
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium text-slate-700">Amp (I)</span>
              <input 
                type="number" 
                inputMode="decimal"
                value={amp} 
                onChange={(e) => setAmp(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                placeholder="0.00" 
                className="text-right bg-transparent outline-none text-blue-600 font-bold w-24 placeholder:text-slate-300" 
              />
            </div>
          </div>
          
          <button 
            onClick={handleToggleAction} 
            className={`w-full mt-6 font-bold py-5 px-4 rounded-2xl transition-all shadow-md active:scale-95 text-xl ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            }`}
          >
            {isRunning ? 'HENTI' : 'MULA'}
          </button>
          
          <p className="text-center text-slate-400 text-[10px] mt-4 uppercase tracking-widest font-bold px-4">
            {isRunning ? 'Sila tekan Henti apabila cakera tamat pusingan' : 'Masukkan semua nilai & tekan Mula'}
          </p>
        </div>
      </div>
    </div>
  );
}

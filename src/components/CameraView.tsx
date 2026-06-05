import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Activity, VideoOff, Square, Maximize, Minimize, Eye, EyeOff } from 'lucide-react';

const BLINK_THRESHOLD = 120;

export default function CameraView() {
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState('Sedia. Tekan butang Mula.');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // State baru untuk Voltan
  const [voltage, setVoltage] = useState<number | ''>('');
  const [constant, setConstant] = useState<number | ''>('');
  const [amps, setAmps] = useState<number | ''>('');
  const [targetSamples, setTargetSamples] = useState<number | ''>('');
  
  const [currentSamples, setCurrentSamples] = useState<number[]>([]);
  const [completedAverage, setCompletedAverage] = useState<number | null>(null);

  const targetSamplesRef = useRef<number>(3);
  useEffect(() => {
    targetSamplesRef.current = Number(targetSamples) || 1;
  }, [targetSamples]);

  // Formula Standard: 3600000 / (V * C * I)
  const theoreticalTime = (voltage && constant && amps) 
    ? 3600000 / (Number(voltage) * Number(constant) * Number(amps)) 
    : null;
    
  const runningAvg = currentSamples.length > 0 ? currentSamples.reduce((a, b) => a + b, 0) / currentSamples.length : null;
  const displayCameraTime = completedAverage !== null ? completedAverage : runningAvg;
  const errorPercentage = (theoreticalTime && displayCameraTime) ? ((theoreticalTime - displayCameraTime) / displayCameraTime) * 100 : null;
  const isVerified = completedAverage !== null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const isProcessingRef = useRef(false);
  const lastStateRef = useRef(0);
  const lastBlinkTimeRef = useRef(0);
  const lastProcessTimeRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const processFrame = useCallback((timestamp: number) => {
    if (!isProcessingRef.current || !videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (timestamp - lastProcessTimeRef.current < 66) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastProcessTimeRef.current = timestamp;

      const PROCESS_SIZE = 64;
      if (canvas.width !== PROCESS_SIZE) {
        canvas.width = PROCESS_SIZE;
        canvas.height = PROCESS_SIZE;
      }

      ctx.drawImage(video, 0, 0, PROCESS_SIZE, PROCESS_SIZE);
      const imageData = ctx.getImageData(0, 0, PROCESS_SIZE, PROCESS_SIZE);
      const data = imageData.data;
      
      let totalRed = 0;
      let sampleCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalRed += data[i];
        sampleCount++;
      }
      const avgRedIntensity = totalRed / sampleCount;

      const currentState = avgRedIntensity > BLINK_THRESHOLD ? 1 : 0;
      const now = performance.now();

      if (currentState === 1 && lastStateRef.current === 0) {
        if (lastBlinkTimeRef.current > 0) {
          const timeDiff = (now - lastBlinkTimeRef.current) / 1000;
          setCurrentSamples(prev => {
            const newSamples = [...prev, timeDiff];
            const target = targetSamplesRef.current;
            if (newSamples.length >= target) {
              const avg = newSamples.reduce((a, b) => a + b, 0) / newSamples.length;
              setCompletedAverage(avg);
              setStatus(`Disahkan ${target} sampel! Mula semula...`);
              return [];
            } else {
              setStatus(`Mengumpul sampel ${newSamples.length}/${target}...`);
              return newSamples;
            }
          });
        } else {
          setStatus('Kelipan dikesan. Menunggu...');
        }
        lastBlinkTimeRef.current = now;
      }

      lastStateRef.current = currentState;
    } catch (err) {
      console.error("Error in processFrame:", err);
    }
    
    animationFrameIdRef.current = requestAnimationFrame(processFrame);
  }, []);

  const startCamera = async () => {
    try {
      setCurrentSamples([]);
      setCompletedAverage(null);
      lastBlinkTimeRef.current = 0;
      lastStateRef.current = 0;
      setStatus('Meminta akses kamera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play error:", e));
          setCameraActive(true);
          isProcessingRef.current = true;
          setStatus('Kamera aktif. Halakan pada lampu.');
          processFrame(performance.now());
        };
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      try {
        setStatus('Mencuba kamera lalai...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Play error:", e));
            setCameraActive(true);
            isProcessingRef.current = true;
            setStatus('Kamera aktif. Halakan pada lampu.');
            processFrame(performance.now());
          };
        }
      } catch (fallbackErr: any) {
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setStatus('Kebenaran kamera ditolak. Sila benarkan dalam tetapan.');
        } else {
          setStatus(`Ralat: ${fallbackErr.name || fallbackErr.message}`);
        }
      }
    }
  };

  const stopCamera = () => {
    isProcessingRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStatus('Kamera dihentikan.');
  };

  return (
    <div className={isFullScreen ? "fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200" : "flex flex-col h-full bg-black animate-in fade-in duration-300"}>
      {/* Camera Feed Area */}
      <div className={isFullScreen ? "relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden" : "relative flex-none h-[40vh] bg-slate-900 flex items-center justify-center overflow-hidden"}>
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-10">
            <VideoOff className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">Kamera ditutup</p>
          </div>
        )}
        
        {/* Native Video Element */}
        <video 
          ref={videoRef} 
          className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : 'block'}`} 
          playsInline 
          muted 
          autoPlay 
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Normal View Overlays */}
        {!isFullScreen && (
          <>
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                <span className="text-xs font-medium text-white">{cameraActive ? 'LIVE' : 'OFFLINE'}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 max-w-[60%]">
                <p className="text-[10px] text-white truncate">{status}</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-20 flex gap-3">
              {cameraActive && (
                <button 
                  onClick={() => setIsFullScreen(true)}
                  className="w-14 h-14 rounded-full bg-slate-800/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                >
                  <Maximize className="w-6 h-6" />
                </button>
              )}
              <button 
                onClick={cameraActive ? stopCamera : startCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${cameraActive ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'}`}
              >
                {cameraActive ? <Square className="w-6 h-6 fill-current" /> : <Camera className="w-6 h-6" />}
              </button>
            </div>
          </>
        )}

        {/* Full Screen Overlays */}
        {isFullScreen && cameraActive && (
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 pb-12">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setIsFullScreen(false)} 
                  className="p-3 bg-black/50 backdrop-blur-md text-white rounded-full pointer-events-auto hover:bg-black/70 transition-colors shadow-lg"
                >
                  <Minimize className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setShowControls(!showControls)} 
                  className="p-3 bg-black/50 backdrop-blur-md text-white rounded-full pointer-events-auto hover:bg-black/70 transition-colors shadow-lg"
                >
                  {showControls ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              
              {showControls && (
                <div className="bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 pointer-events-auto max-w-[200px] shadow-lg">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-xs text-white line-clamp-2">{status}</p>
                </div>
              )}
            </div>

            {showControls && (
              <div className="space-y-3 pointer-events-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Masa Kamera</p>
                    <p className="text-xl font-bold text-white">
                      {displayCameraTime ? displayCameraTime.toFixed(3) + 's' : '--'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      <span className="text-[10px] text-white/70">Sampel: {currentSamples.length}/{targetSamples || 1}</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Masa Teori</p>
                    <p className="text-xl font-bold text-blue-400">
                      {theoreticalTime ? theoreticalTime.toFixed(3) + 's' : '--'}
                    </p>
                  </div>
                </div>

                {errorPercentage !== null && (
                  <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-lg ${Math.abs(errorPercentage) <= 2 ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Ralat {isVerified ? '(Sah)' : ''}</p>
                      <p className={`text-2xl font-black ${Math.abs(errorPercentage) <= 2 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {errorPercentage > 0 ? '+' : ''}{errorPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls & Results Area (Bottom Half) */}
      {!isFullScreen && (
        <div className="flex-1 bg-slate-50 rounded-t-3xl -mt-6 relative z-10 overflow-y-auto pb-24 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-5"></div>
          
          <div className="px-5 space-y-6">
            {/* Results Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Masa Kamera</p>
                <p className="text-2xl font-bold text-slate-800">
                  {displayCameraTime ? displayCameraTime.toFixed(3) + 's' : '--'}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  <span className="text-[10px] font-medium text-slate-500">Sampel: {currentSamples.length}/{targetSamples || 1}</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Masa Teori</p>
                <p className="text-2xl font-bold text-blue-600">
                  {theoreticalTime ? theoreticalTime.toFixed(3) + 's' : '--'}
                </p>
              </div>
            </div>

            {/* Error Percentage */}
            {errorPercentage !== null && (
              <div className={`p-4 rounded-2xl border ${Math.abs(errorPercentage) <= 2 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${Math.abs(errorPercentage) <= 2 ? 'text-emerald-600' : 'text-red-600'}`} />
                    <p className={`text-sm font-bold uppercase tracking-wider ${Math.abs(errorPercentage) <= 2 ? 'text-emerald-700' : 'text-red-700'}`}>
                      Ralat {isVerified ? '(Sah)' : ''}
                    </p>
                  </div>
                  <p className={`text-3xl font-black tracking-tight ${Math.abs(errorPercentage) <= 2 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {errorPercentage > 0 ? '+' : ''}{errorPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}

            {/* Settings List (Ada tambahan Voltan) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Tetapan Formula</h3>
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm border border-slate-100">
                {[
                  { label: 'Voltan (V)', state: voltage, set: setVoltage, placeholder: '240', mode: 'numeric' },
                  { label: 'Pemalar (C)', state: constant, set: setConstant, placeholder: '1000', mode: 'numeric' },
                  { label: 'Arus (Amps)', state: amps, set: setAmps, placeholder: '3.0', mode: 'decimal' },
                  { label: 'Sasaran Sampel', state: targetSamples, set: setTargetSamples, placeholder: '5', mode: 'numeric' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 px-4">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <input 
                      type="number" 
                      inputMode={item.mode as any}
                      value={item.state} 
                      onChange={(e) => item.set(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                      placeholder={item.placeholder}
                      className="text-right bg-transparent outline-none text-blue-600 font-semibold w-24 placeholder:text-slate-300" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
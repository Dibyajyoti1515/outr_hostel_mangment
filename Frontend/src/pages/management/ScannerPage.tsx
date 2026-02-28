import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { CheckCircle2, XCircle, QrCode, Leaf, Drumstick, RotateCcw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { managementApi } from '../../lib/api';
import { ScanResult } from '../../types';
import { cn } from '../../lib/utils';
import { todayDate } from '../../lib/utils';

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
      } catch {}
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }

    const onSuccess = async (decodedText: string) => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setScanState('processing');

      try {
        const res = await managementApi.scanQR(decodedText);
        setResult(res.data);
        setScanState('success');
        setScanCount(p => p + 1);
        // Auto-resume after 3 seconds
        setTimeout(() => {
          setScanState('scanning');
          setResult(null);
          isProcessing.current = false;
        }, 3000);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Scan failed';
        setErrorMsg(msg);
        setScanState('error');
        setTimeout(() => {
          setScanState('scanning');
          setResult(null);
          setErrorMsg('');
          isProcessing.current = false;
        }, 2500);
      }
    };

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        onSuccess,
        () => {}
      );
      setScanState('scanning');
      setCameraActive(true);
    } catch (err: any) {
      toast.error('Camera access denied. Check browser permissions.');
      setScanState('idle');
    }
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const FoodBadge = ({ type }: { type: string }) => {
    if (type === 'veg' || type === '🥦 Veg')
      return <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xl px-5 py-2.5 rounded-xl"><Leaf className="w-5 h-5" /> VEG</div>;
    if (type === 'nonveg' || type === '🍗 Non-Veg')
      return <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xl px-5 py-2.5 rounded-xl"><Drumstick className="w-5 h-5" /> NON-VEG</div>;
    return <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xl px-5 py-2.5 rounded-xl">🍳 BREAKFAST</div>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">QR Scanner</h1>
          <p className="text-xs text-gray-400">{todayDate()} · {scanCount} scanned today</p>
        </div>
        {scanCount > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            {scanCount} served
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Camera Area */}
        <div className="relative bg-gray-900 border border-white/10 rounded-3xl overflow-hidden">
          {/* QR Reader element - always in DOM when camera is active */}
          <div
            id="qr-reader"
            className={cn(
              "w-full transition-all duration-300",
              cameraActive ? "block" : "hidden"
            )}
            style={{ minHeight: cameraActive ? '300px' : '0' }}
          />

          {/* Scan overlay */}
          {scanState === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-60 h-60">
                {/* Corner brackets */}
                {[
                  'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                  'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                  'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                  'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 border-brand-400 ${cls}`} />
                ))}
                {/* Scan line */}
                <div className="absolute inset-x-0 h-0.5 bg-brand-400/70 shadow-[0_0_8px_2px_rgba(99,102,241,0.6)] animate-[scanLine_2s_linear_infinite]" style={{ top: '50%' }} />
              </div>
            </div>
          )}

          {/* Processing overlay */}
          {scanState === 'processing' && cameraActive && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" style={{ borderWidth: 3 }} />
                <p className="text-white font-medium text-sm">Verifying...</p>
              </div>
            </div>
          )}

          {/* Success overlay */}
          {scanState === 'success' && result && cameraActive && (
            <div className="absolute inset-0 bg-emerald-900/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
              <div className="text-center p-6">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-bold text-xl mb-1">{result.student?.name}</p>
                <p className="text-emerald-300 text-sm mb-4">{result.student?.registrationNo} · Bed {result.student?.badNo}</p>
                <FoodBadge type={result.meal?.foodType || ''} />
              </div>
            </div>
          )}

          {/* Error overlay */}
          {scanState === 'error' && cameraActive && (
            <div className="absolute inset-0 bg-rose-900/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
              <div className="text-center p-6">
                <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-3" />
                <p className="text-white font-bold text-lg mb-1">Scan Failed</p>
                <p className="text-rose-300 text-sm">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Idle state */}
          {!cameraActive && (
            <div className="h-72 flex flex-col items-center justify-center gap-5">
              <div className="w-24 h-24 bg-gray-800 rounded-3xl flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Camera Off</p>
                <p className="text-gray-500 text-sm">Press Start to begin scanning</p>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-xl shadow-emerald-600/20"
            >
              <QrCode className="w-6 h-6" />
              Start Scanner
            </button>
          ) : (
            <>
              <button
                onClick={stopCamera}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold py-4 rounded-2xl text-base transition-all active:scale-95"
              >
                Stop
              </button>
              <button
                onClick={async () => { await stopCamera(); setTimeout(startCamera, 500); }}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium py-4 px-6 rounded-2xl transition-all active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Last scan result summary */}
        {result && scanState !== 'success' && (
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Last Scan</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{result.student?.name}</p>
                <p className="text-xs text-gray-400">{result.student?.registrationNo}</p>
              </div>
              <FoodBadge type={result.meal?.foodType || ''} />
            </div>
          </div>
        )}

        {/* Manual token input (fallback for devices without camera) */}
        <ManualInput onResult={(r) => { setResult(r); setScanState('success'); setScanCount(p => p + 1); }} />
      </div>
    </div>
  );
}

function ManualInput({ onResult }: { onResult: (r: ScanResult) => void }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      const res = await managementApi.scanQR(token.trim());
      onResult(res.data);
      toast.success(res.data.message);
      setToken('');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full text-xs text-gray-500 hover:text-gray-300 py-2 transition-colors underline">
      Manual token entry (fallback)
    </button>
  );

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400">Manual Token Entry</p>
      <textarea
        value={token}
        onChange={e => setToken(e.target.value)}
        placeholder="Paste QR JWT token here..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none h-20"
      />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 bg-white/5 text-gray-400 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all">Cancel</button>
        <button onClick={submit} disabled={loading || !token} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50">
          {loading ? 'Verifying...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, AlertCircle, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { QRData } from '../../types';
import { cn } from '../../lib/utils';

export default function MyQRCode() {
  const { studentUser } = useStore();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const loadQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getQR();
      setQrData(res.data.qr);
      setTimeLeft(res.data.qr.expiresIn);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate QR');
      setQrData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQR(); }, [loadQR]);

  // Countdown timer
  useEffect(() => {
    if (!timeLeft) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          loadQR(); // auto refresh when expired
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, loadQR]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const mealColors: Record<string, string> = {
    breakfast: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    lunch: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    dinner: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
  };

  const mealLabels: Record<string, string> = {
    breakfast: '🍳 Breakfast',
    lunch: '🍱 Lunch',
    dinner: '🌙 Dinner',
  };

  return (
    <div className="p-4 max-w-sm mx-auto flex flex-col items-center gap-6">
      <div className="text-center pt-2">
        <h1 className="text-xl font-bold text-white">Meal QR Code</h1>
        <p className="text-xs text-gray-400 mt-1">Show this to the food counter</p>
      </div>

      {loading && (
        <div className="w-full bg-gray-900 border border-white/10 rounded-3xl p-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Generating QR code...</p>
        </div>
      )}

      {error && !loading && (
        <div className="w-full bg-gray-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-white mb-1">No Active Meal</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 w-full text-left space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meal Times</p>
            {[
              { label: '🍳 Breakfast', time: '7:00 AM – 10:00 AM' },
              { label: '🍱 Lunch', time: '12:00 PM – 4:00 PM' },
              { label: '🌙 Dinner', time: '7:00 PM – 10:00 PM' },
            ].map(m => (
              <div key={m.label} className="flex justify-between text-xs">
                <span className="text-gray-300">{m.label}</span>
                <span className="text-gray-500">{m.time}</span>
              </div>
            ))}
          </div>
          <button onClick={loadQR} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {qrData && !loading && (
        <>
          {/* Meal Type Badge */}
          <div className={cn("w-full bg-gradient-to-r border rounded-2xl p-4 text-center", mealColors[qrData.mealType] || 'border-white/10')}>
            <p className="text-2xl font-bold text-white">{mealLabels[qrData.mealType]}</p>
            <p className="text-xs text-gray-400 mt-1">{qrData.date}</p>
          </div>

          {/* QR Code Image */}
          <div className="bg-white rounded-3xl p-5 shadow-2xl shadow-brand-500/10">
            <img
              src={qrData.image}
              alt="QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>

          {/* Student info */}
          <div className="w-full bg-gray-900 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Name</span>
              <span className="text-white font-medium">{studentUser?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Reg No.</span>
              <span className="text-white font-mono">{studentUser?.registrationNo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Hostel / Bed</span>
              <span className="text-white">{studentUser?.hostelName} · {studentUser?.badNo}</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Expires in <span className={cn("font-bold", timeLeft < 300 ? "text-rose-400" : "text-brand-400")}>{formatTime(timeLeft)}</span></span>
          </div>

          <button onClick={loadQR} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors active:scale-95">
            <RefreshCw className="w-4 h-4" /> Refresh QR
          </button>
        </>
      )}
    </div>
  );
}
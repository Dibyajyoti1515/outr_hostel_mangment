import { useState, useEffect } from 'react';
import { RefreshCw, Leaf, Drumstick, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { managementApi } from '../../lib/api';
import { todayDate, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface ScanEntry {
  _id: string;
  student: { name: string; registrationNo: string; badNo: string };
  mealType: string;
  foodType: string;
  scannedAt: string;
  hostelName: string;
}

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayDate());
  const [mealType, setMealType] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await managementApi.getScanHistory({ date, mealType: mealType || undefined });
      setScans(res.data.scans);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date, mealType]);

  const mealIcon: Record<string, string> = { breakfast: '🍳', lunch: '🍱', dinner: '🌙' };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const countsByMeal = scans.reduce((acc, s) => {
    acc[s.mealType] = (acc[s.mealType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Scan History</h1>
          <p className="text-xs text-gray-400">{scans.length} total scans</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 text-gray-400 hover:text-white transition-colors">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
        />
        <select
          value={mealType}
          onChange={e => setMealType(e.target.value)}
          className="bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="">All meals</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>

      {/* Meal summary chips */}
      {Object.keys(countsByMeal).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(countsByMeal).map(([meal, count]) => (
            <div key={meal} className="flex items-center gap-1.5 bg-gray-900 border border-white/10 rounded-full px-3 py-1.5 text-xs">
              <span>{mealIcon[meal]}</span>
              <span className="text-gray-300 capitalize">{meal}</span>
              <span className="text-brand-400 font-bold">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="bg-gray-900 rounded-xl h-14 animate-pulse" />)}
        </div>
      ) : scans.length === 0 ? (
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400">No scans found for this filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map(scan => (
            <div key={scan._id} className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl shrink-0">{mealIcon[scan.mealType]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{scan.student?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-400 font-mono">{scan.student?.registrationNo} · Bed {scan.student?.badNo}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {scan.foodType === 'veg' ? (
                  <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <Leaf className="w-3 h-3" /> Veg
                  </div>
                ) : scan.foodType === 'nonveg' ? (
                  <div className="flex items-center gap-1 bg-rose-500/20 text-rose-400 text-xs px-2.5 py-1 rounded-full border border-rose-500/30">
                    <Drumstick className="w-3 h-3" /> Non-Veg
                  </div>
                ) : (
                  <div className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/30">
                    🍳 Breakfast
                  </div>
                )}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(scan.scannedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
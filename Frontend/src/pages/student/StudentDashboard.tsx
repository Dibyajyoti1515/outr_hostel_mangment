import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Clock, QrCode, ChevronRight, Leaf, Drumstick } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { tomorrowDate, todayDate, formatDate, getCurrentMealLabel } from '../../lib/utils';
import { FoodPreference, FoodType } from '../../types';

export default function StudentDashboard() {
  const nav = useNavigate();
  const { studentUser } = useStore();
  const [todayPref, setTodayPref] = useState<FoodPreference | null>(null);
  const [tomorrowPref, setTomorrowPref] = useState<FoodPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const currentMeal = getCurrentMealLabel();

  useEffect(() => {
    const load = async () => {
      try {
        const [todayRes, tmrRes] = await Promise.all([
          studentApi.getPreference(todayDate()),
          studentApi.getPreference(tomorrowDate()),
        ]);
        setTodayPref(todayRes.data.preference);
        setTomorrowPref(tmrRes.data.preference);
      } catch {
        toast.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const MealBadge = ({ selected, type, meal }: { selected?: boolean; type?: FoodType; meal: string }) => {
    if (!selected) return <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">Skipped</span>;
    if (meal === 'breakfast') return <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">✓ Breakfast</span>;
    return type === 'veg'
      ? <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1"><Leaf className="w-3 h-3" />Veg</span>
      : <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full border border-rose-500/30 flex items-center gap-1"><Drumstick className="w-3 h-3" />Non-Veg</span>;
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-brand-600/20 to-purple-600/10 border border-brand-500/20 rounded-2xl p-5">
        <p className="text-xs text-brand-300 font-medium mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋</p>
        <h2 className="text-xl font-bold text-white mb-0.5">{studentUser?.name?.split(' ')[0]}</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="bg-white/10 px-2 py-0.5 rounded-full">{studentUser?.registrationNo}</span>
          <span>·</span>
          <span>Bed {studentUser?.badNo}</span>
        </div>
      </div>

      {/* Current Meal Banner */}
      {currentMeal && (
        <div className={`bg-gray-900 border border-white/10 rounded-2xl p-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Active Now</p>
            <p className={`text-lg font-bold ${currentMeal.color}`}>
              {currentMeal.label} Time 🍽️
            </p>
          </div>
          <button
            onClick={() => nav('/student/qr')}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            Get QR
          </button>
        </div>
      )}

      {/* Today's Meals */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="bg-gray-900 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Today Summary */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Today's Meals
              </h3>
              <span className="text-xs text-gray-500">{formatDate(todayDate())}</span>
            </div>
            {todayPref ? (
              <div className="grid grid-cols-3 gap-3">
                {(['breakfast','lunch','dinner'] as const).map(meal => {
                  const m = todayPref[meal] as any;
                  return (
                    <div key={meal} className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-2 capitalize">{meal === 'breakfast' ? '🍳' : meal === 'lunch' ? '🍱' : '🌙'} {meal}</p>
                      <MealBadge selected={m?.selected} type={m?.type} meal={meal} />
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-gray-500 text-sm">No preference set</p>}
          </div>

          {/* Tomorrow Preview */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-gray-400" />
                Tomorrow's Plan
              </h3>
              <button onClick={() => nav('/student/calendar')} className="flex items-center gap-1 text-brand-400 text-xs hover:text-brand-300 transition-colors">
                Edit <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {tomorrowPref ? (
              <div className="grid grid-cols-3 gap-3">
                {(['breakfast','lunch','dinner'] as const).map(meal => {
                  const m = tomorrowPref[meal] as any;
                  return (
                    <div key={meal} className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-2 capitalize">{meal === 'breakfast' ? '🍳' : meal === 'lunch' ? '🍱' : '🌙'} {meal}</p>
                      <MealBadge selected={m?.selected} type={m?.type} meal={meal} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">Using default preference</p>
                <button onClick={() => nav('/student/calendar')} className="text-xs text-brand-400 hover:text-brand-300">Set now →</button>
              </div>
            )}
            {tomorrowPref?.isAutoFilled && (
              <p className="text-xs text-amber-400/70 mt-3 flex items-center gap-1">
                ⚡ Auto-filled from previous day
              </p>
            )}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => nav('/student/qr')} className="bg-gray-900 border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-gray-800 transition-all active:scale-95">
          <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">My QR</p>
            <p className="text-xs text-gray-500">Scan for meal</p>
          </div>
        </button>
        <button onClick={() => nav('/student/calendar')} className="bg-gray-900 border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-gray-800 transition-all active:scale-95">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">📅</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Calendar</p>
            <p className="text-xs text-gray-500">Set preferences</p>
          </div>
        </button>
      </div>
    </div>
  );
}
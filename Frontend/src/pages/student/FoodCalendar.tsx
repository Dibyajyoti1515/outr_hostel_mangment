import { useState, useEffect } from 'react';
import { Check, Leaf, Drumstick, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentApi } from '../../lib/api';
import { formatDate, tomorrowDate, todayDate } from '../../lib/utils';
import { FoodPreference } from '../../types';
import { format, addDays } from 'date-fns';
import { cn } from '../../lib/utils';

interface DayPref {
  date: string;
  breakfast: { selected: boolean };
  lunch: { selected: boolean; type: 'veg' | 'nonveg' };
  dinner: { selected: boolean; type: 'veg' | 'nonveg' };
  isAutoFilled?: boolean;
}

export default function FoodCalendar() {
  const [calendar, setCalendar] = useState<DayPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edited, setEdited] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await studentApi.getCalendar();
        setCalendar(res.data.calendar.map((c: any) => ({
          date: c.date,
          breakfast: c.breakfast || { selected: true },
          lunch: c.lunch || { selected: true, type: 'veg' },
          dinner: c.dinner || { selected: true, type: 'veg' },
          isAutoFilled: c.isAutoFilled,
        })));
      } catch {
        toast.error('Failed to load calendar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (date: string, path: string, value: any) => {
    setCalendar(prev => prev.map(d => {
      if (d.date !== date) return d;
      const updated = { ...d };
      const parts = path.split('.');
      if (parts.length === 2) {
        (updated as any)[parts[0]] = { ...(updated as any)[parts[0]], [parts[1]]: value };
      }
      return updated;
    }));
    setEdited(prev => new Set([...prev, date]));
  };

  const saveDay = async (dayPref: DayPref) => {
    setSaving(dayPref.date);
    try {
      await studentApi.setPreference(dayPref);
      toast.success(`Saved for ${formatDate(dayPref.date)}!`);
      setEdited(prev => { const n = new Set(prev); n.delete(dayPref.date); return n; });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const isPast = (date: string) => date <= todayDate();

  const ToggleBtn = ({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all active:scale-95",
        active ? `${color} text-white` : "bg-white/5 text-gray-500 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );

  if (loading) return (
    <div className="p-4 space-y-3">
      {[1,2,3].map(i => <div key={i} className="bg-gray-900 rounded-2xl h-40 animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8">
      <div>
        <h1 className="text-xl font-bold text-white">Food Calendar</h1>
        <p className="text-xs text-gray-400 mt-1">Set your meal preferences for the week ahead</p>
      </div>

      {calendar.map((day) => {
        const past = isPast(day.date);
        const isEdited = edited.has(day.date);
        const isSaving = saving === day.date;

        return (
          <div key={day.date} className={cn(
            "bg-gray-900 border rounded-2xl p-4 transition-all",
            past ? "border-white/5 opacity-60" : isEdited ? "border-brand-500/40" : "border-white/10"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-white">{formatDate(day.date)}</p>
                <p className="text-xs text-gray-500">{day.date}</p>
              </div>
              <div className="flex items-center gap-2">
                {day.isAutoFilled && !isEdited && (
                  <span className="text-xs text-amber-400/70 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">Auto</span>
                )}
                {!past && isEdited && (
                  <button
                    onClick={() => saveDay(day)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                )}
                {past && <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">Past</span>}
              </div>
            </div>

            <div className="space-y-3">
              {/* Breakfast */}
              <div className="flex items-center gap-3">
                <span className="text-sm w-20 text-gray-400 flex items-center gap-1.5">🍳 <span className="text-xs">Breakfast</span></span>
                <div className="flex gap-2 flex-1">
                  <ToggleBtn
                    active={day.breakfast.selected}
                    onClick={() => !past && update(day.date, 'breakfast.selected', true)}
                    label="✓ Include"
                    color="bg-amber-600"
                  />
                  <ToggleBtn
                    active={!day.breakfast.selected}
                    onClick={() => !past && update(day.date, 'breakfast.selected', false)}
                    label="✕ Skip"
                    color="bg-gray-600"
                  />
                </div>
              </div>

              {/* Lunch */}
              <div className="flex items-center gap-3">
                <span className="text-sm w-20 text-gray-400 flex items-center gap-1.5">🍱 <span className="text-xs">Lunch</span></span>
                <div className="flex gap-2 flex-1">
                  {day.lunch.selected ? (
                    <>
                      <ToggleBtn active={day.lunch.type === 'veg'} onClick={() => !past && update(day.date, 'lunch.type', 'veg')} label="🥦 Veg" color="bg-emerald-600" />
                      <ToggleBtn active={day.lunch.type === 'nonveg'} onClick={() => !past && update(day.date, 'lunch.type', 'nonveg')} label="🍗 Non-Veg" color="bg-rose-600" />
                      <ToggleBtn active={false} onClick={() => !past && update(day.date, 'lunch.selected', false)} label="Skip" color="bg-gray-600" />
                    </>
                  ) : (
                    <ToggleBtn active={true} onClick={() => !past && update(day.date, 'lunch.selected', true)} label="+ Add Lunch" color="bg-emerald-700" />
                  )}
                </div>
              </div>

              {/* Dinner */}
              <div className="flex items-center gap-3">
                <span className="text-sm w-20 text-gray-400 flex items-center gap-1.5">🌙 <span className="text-xs">Dinner</span></span>
                <div className="flex gap-2 flex-1">
                  {day.dinner.selected ? (
                    <>
                      <ToggleBtn active={day.dinner.type === 'veg'} onClick={() => !past && update(day.date, 'dinner.type', 'veg')} label="🥦 Veg" color="bg-emerald-600" />
                      <ToggleBtn active={day.dinner.type === 'nonveg'} onClick={() => !past && update(day.date, 'dinner.type', 'nonveg')} label="🍗 Non-Veg" color="bg-rose-600" />
                      <ToggleBtn active={false} onClick={() => !past && update(day.date, 'dinner.selected', false)} label="Skip" color="bg-gray-600" />
                    </>
                  ) : (
                    <ToggleBtn active={true} onClick={() => !past && update(day.date, 'dinner.selected', true)} label="+ Add Dinner" color="bg-blue-700" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
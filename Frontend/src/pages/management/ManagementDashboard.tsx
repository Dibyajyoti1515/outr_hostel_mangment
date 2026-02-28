import { useState, useEffect } from 'react';
import { RefreshCw, Users, Leaf, Drumstick, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { managementApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { todayDate, tomorrowDate, formatDate, getHostelAccent } from '../../lib/utils';
import { DashboardData, NotEatenEntry } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '../../lib/utils';

const HOSTELS = ['RHR', 'APJ', 'KHR', 'KCHR'];

export default function ManagementDashboard() {
  const { adminUser } = useStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayDate());
  const [hostel, setHostel] = useState(adminUser?.hostelName || 'RHR');
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await managementApi.getDashboard(date, hostel);
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date, hostel]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, date, hostel]);

  const meals = [
    {
      key: 'breakfast',
      label: 'Breakfast',
      icon: '🍳',
      color: 'amber',
      count: (data?.counts.breakfast.selected || 0),
      sub: null,
    },
    {
      key: 'lunch',
      label: 'Lunch',
      icon: '🍱',
      color: 'emerald',
      veg: data?.counts.lunch.veg || 0,
      nonveg: data?.counts.lunch.nonveg || 0,
    },
    {
      key: 'dinner',
      label: 'Dinner',
      icon: '🌙',
      color: 'blue',
      veg: data?.counts.dinner.veg || 0,
      nonveg: data?.counts.dinner.nonveg || 0,
    },
  ];

  const NotEatenList = ({ meal, students }: { meal: string; students: NotEatenEntry[] }) => (
    <div className="mt-3 border-t border-white/5 pt-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Not eaten yet ({students.length})
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {students.slice(0, 20).map(s => (
          <div key={s._id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <span className="text-sm text-white">{s.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">{s.registrationNo}</span>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">Bed {s.badNo}</span>
            </div>
          </div>
        ))}
        {students.length > 20 && (
          <p className="text-xs text-gray-500 text-center py-2">+{students.length - 20} more</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-gray-400">Food management overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-all",
              autoRefresh
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                : "bg-white/5 border-white/10 text-gray-400"
            )}
          >
            {autoRefresh ? '● Live' : 'Paused'}
          </button>
          <button onClick={load} disabled={loading} className="p-2 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
        />
        {adminUser?.role === 'super_admin' && (
          <select
            value={hostel}
            onChange={e => setHostel(e.target.value as "RHR" | "APJ" | "KHR" | "KCHR")}
            className="bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
          >
            {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        )}
      </div>

      {loading && !data && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-gray-900 rounded-2xl h-24 animate-pulse" />)}
        </div>
      )}

      {data && (
        <>
          {/* Total students */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Students</p>
                <p className="text-3xl font-extrabold text-white">{data.totalStudents}</p>
              </div>
            </div>
            <div className={`text-right`}>
              <p className={`text-2xl font-bold ${getHostelAccent(data.hostelName)}`}>{data.hostelName}</p>
              <p className="text-xs text-gray-500">{formatDate(data.date)}</p>
            </div>
          </div>

          {/* Meal Cards */}
          {meals.map((meal) => {
            const notEaten = data.notEaten[meal.key as keyof typeof data.notEaten];
            const isExpanded = expandedMeal === meal.key;
            const total = meal.key === 'breakfast'
              ? (meal.count || 0)
              : ((meal.veg || 0) + (meal.nonveg || 0));

            return (
              <div key={meal.key} className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meal.icon}</span>
                      <h3 className="font-semibold text-white">{meal.label}</h3>
                      <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{total} eating</span>
                    </div>
                    {notEaten.count > 0 && (
                      <button
                        onClick={() => setExpandedMeal(isExpanded ? null : meal.key)}
                        className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg hover:bg-amber-400/20 transition-all"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {notEaten.count} not eaten
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {meal.key === 'breakfast' ? (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-amber-400">{meal.count}</p>
                        <p className="text-xs text-gray-400">Eating</p>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-gray-500">{data.counts.breakfast.notSelected}</p>
                        <p className="text-xs text-gray-400">Skipping</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs text-emerald-400 font-medium">Veg</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">{meal.veg}</p>
                      </div>
                      <div className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Drumstick className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-xs text-rose-400 font-medium">Non-Veg</span>
                        </div>
                        <p className="text-2xl font-bold text-rose-400">{meal.nonveg}</p>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Skip</p>
                        <p className="text-2xl font-bold text-gray-500">{(data.counts as any)[meal.key]?.notSelected || 0}</p>
                      </div>
                    </div>
                  )}
                </div>

                {isExpanded && notEaten.students.length > 0 && (
                  <div className="px-5 pb-5">
                    <NotEatenList meal={meal.key} students={notEaten.students} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Lunch Pie Chart */}
          {(data.counts.lunch.veg + data.counts.lunch.nonveg) > 0 && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Lunch Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Veg', value: data.counts.lunch.veg },
                      { name: 'Non-Veg', value: data.counts.lunch.nonveg },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend iconType="circle" formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
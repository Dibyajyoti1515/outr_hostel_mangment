import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, addDays, isToday, isTomorrow } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
};

export const getHostelColor = (hostel: string) => {
  const map: Record<string, string> = {
    RHR: 'from-violet-600 to-indigo-600',
    APJ: 'from-cyan-600 to-blue-600',
    KHR: 'from-emerald-600 to-teal-600',
    KCHR: 'from-rose-600 to-pink-600',
  };
  return map[hostel] || 'from-gray-600 to-gray-700';
};

export const getHostelAccent = (hostel: string) => {
  const map: Record<string, string> = {
    RHR: 'text-violet-400',
    APJ: 'text-cyan-400',
    KHR: 'text-emerald-400',
    KCHR: 'text-rose-400',
  };
  return map[hostel] || 'text-gray-400';
};

export const getMealIcon = (meal: string) => {
  const icons: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🍱',
    dinner: '🌙',
  };
  return icons[meal] || '🍽️';
};

export const getCurrentMealLabel = () => {
  const now = new Date();
  const h = now.getHours();
  if (h >= 7 && h < 10) return { meal: 'breakfast', label: 'Breakfast', color: 'text-amber-400' };
  if (h >= 12 && h < 16) return { meal: 'lunch', label: 'Lunch', color: 'text-green-400' };
  if (h >= 19 && h < 22) return { meal: 'dinner', label: 'Dinner', color: 'text-blue-400' };
  return null;
};

export const tomorrowDate = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');
export const todayDate = () => format(new Date(), 'yyyy-MM-dd');
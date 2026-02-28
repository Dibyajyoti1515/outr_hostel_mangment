import { create } from 'zustand';
import { Student, Management } from '../types';

interface AppStore {
  token: string | null;
  studentUser: Student | null;
  adminUser: Management | null;
  userType: 'student' | 'management' | null;
  setStudentAuth: (token: string, user: Student) => void;
  setAdminAuth: (token: string, user: Management) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useStore = create<AppStore>((set) => ({
  token: null,
  studentUser: null,
  adminUser: null,
  userType: null,

  setStudentAuth: (token, user) => {
    localStorage.setItem('outr_token', token);
    localStorage.setItem('outr_user', JSON.stringify({ type: 'student', user }));
    set({ token, studentUser: user, adminUser: null, userType: 'student' });
  },

  setAdminAuth: (token, user) => {
    localStorage.setItem('outr_token', token);
    localStorage.setItem('outr_user', JSON.stringify({ type: 'management', user }));
    set({ token, adminUser: user, studentUser: null, userType: 'management' });
  },

  logout: () => {
    localStorage.removeItem('outr_token');
    localStorage.removeItem('outr_user');
    set({ token: null, studentUser: null, adminUser: null, userType: null });
  },

  hydrate: () => {
    const token = localStorage.getItem('outr_token');
    const raw = localStorage.getItem('outr_user');
    if (!token || !raw) return;
    try {
      const { type, user } = JSON.parse(raw);
      if (type === 'student') set({ token, studentUser: user, userType: 'student' });
      else if (type === 'management') set({ token, adminUser: user, userType: 'management' });
    } catch {}
  },
}));
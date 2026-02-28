import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, UserCheck, UserX, RefreshCw, Edit2, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { managementApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { Student } from '../../types';
import { cn } from '../../lib/utils';

const HOSTELS = ['RHR', 'APJ', 'KHR', 'KCHR'];

interface AddStudentForm {
  name: string;
  registrationNo: string;
  contactNo: string;
  badNo: string;
  hostelName: string;
  password: string;
  defaultFoodPref: 'veg' | 'nonveg';
}

const defaultForm: AddStudentForm = {
  name: '', registrationNo: '', contactNo: '', badNo: '',
  hostelName: 'RHR', password: '', defaultFoodPref: 'veg',
};

// ⚠️ Must be defined OUTSIDE the parent component.
// If defined inside, React remounts it on every render → input loses focus after each keystroke.
const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
    />
  </div>
);

export default function StudentsPage() {
  const { adminUser } = useStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddStudentForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (adminUser?.role === 'super_admin') params.hostelName = adminUser.hostelName;
      const res = await managementApi.getStudents(params);
      setStudents(res.data.docs);
      setTotalPages(res.data.totalPages);
      setTotalDocs(res.data.totalDocs);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search, adminUser]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await managementApi.createStudent(form);
      toast.success('Student added!');
      setShowAdd(false);
      setForm(defaultForm);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (student: Student) => {
    try {
      await managementApi.updateStudent(student._id, { isActive: !student.isActive });
      toast.success(student.isActive ? 'Student deactivated' : 'Student activated');
      load();
    } catch {
      toast.error('Failed to update student');
    }
  };

  const resetPassword = async (student: Student) => {
    const newPass = prompt(`New password for ${student.name} (leave blank for reg no):`);
    if (newPass === null) return;
    try {
      await managementApi.resetPassword(student._id, newPass || student.registrationNo);
      toast.success('Password reset!');
    } catch {
      toast.error('Failed to reset password');
    }
  };



  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Students</h1>
          <p className="text-xs text-gray-400">{totalDocs} total</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search name, reg no, bed..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-gray-900 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Student List */}
      {loading && students.length === 0 ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="bg-gray-900 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {students.map(student => (
            <div key={student._id} className={cn(
              "bg-gray-900 border rounded-xl px-4 py-3 flex items-center gap-3 transition-all",
              student.isActive ? "border-white/10" : "border-white/5 opacity-50"
            )}>
              <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-brand-400">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{student.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-mono">{student.registrationNo}</span>
                  <span>·</span>
                  <span>Bed {student.badNo}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs font-medium",
                    student.defaultFoodPref === 'veg' ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                  )}>
                    {student.defaultFoodPref}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => resetPassword(student)} className="p-2 text-gray-500 hover:text-amber-400 transition-colors" title="Reset password">
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(student)}
                  className={cn(
                    "p-2 transition-colors",
                    student.isActive ? "text-gray-500 hover:text-red-400" : "text-gray-600 hover:text-emerald-400"
                  )}
                  title={student.isActive ? "Deactivate" : "Activate"}
                >
                  {student.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-all">
            Prev
          </button>
          <span className="text-sm text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-all">
            Next
          </button>
        </div>
      )}

      {/* Add Student Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add New Student</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <InputField label="Full Name" placeholder="Ravi Kumar" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <InputField label="Registration No." placeholder="22CS001" value={form.registrationNo} onChange={e => setForm(p => ({ ...p, registrationNo: e.target.value.toUpperCase() }))} required />
              <InputField label="Contact No." placeholder="9876543210" value={form.contactNo} onChange={e => setForm(p => ({ ...p, contactNo: e.target.value }))} required />
              <InputField label="Bed No." placeholder="3321" value={form.badNo} onChange={e => setForm(p => ({ ...p, badNo: e.target.value }))} required />

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Hostel</label>
                <select value={form.hostelName} onChange={e => setForm(p => ({ ...p, hostelName: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 text-sm">
                  {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Default Food Preference</label>
                <div className="flex gap-3">
                  {(['veg', 'nonveg'] as const).map(t => (
                    <button type="button" key={t} onClick={() => setForm(p => ({ ...p, defaultFoodPref: t }))}
                      className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border", form.defaultFoodPref === t
                        ? t === 'veg' ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-400" : "bg-rose-600/30 border-rose-500/50 text-rose-400"
                        : "bg-white/5 border-white/10 text-gray-400")}>
                      {t === 'veg' ? '🥦 Veg' : '🍗 Non-Veg'}
                    </button>
                  ))}
                </div>
              </div>

              <InputField label="Password (optional, default=reg no)" placeholder="Leave blank for reg no" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} type="text" />

              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 mt-2">
                {submitting ? 'Adding...' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
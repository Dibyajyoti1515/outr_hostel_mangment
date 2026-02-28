import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, QrCode, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/30">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          OUTR Hostel
        </h1>
        <p className="text-xl font-semibold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent mb-3">
          Food Management System
        </p>
        <p className="text-gray-400 text-sm mb-10">
          RHR · APJ · KHR · KCHR
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: QrCode, label: 'QR Meal Pass' },
            { icon: BarChart3, label: 'Live Dashboard' },
            { icon: ShieldCheck, label: 'Hostel Scoped' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-300">
              <Icon className="w-3.5 h-3.5 text-brand-400" />
              {label}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => nav('/login/student')}
            className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-4 rounded-2xl text-lg transition-all duration-200 active:scale-95 shadow-xl shadow-brand-600/30"
          >
            🎓 Student Login
          </button>
          <button
            onClick={() => nav('/login/management')}
            className="flex-1 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-bold py-4 rounded-2xl text-lg transition-all duration-200 active:scale-95 border border-white/10"
          >
            🏢 Management Login
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-600">
          Odisha University of Technology and Research
        </p>
      </div>
    </div>
  );
}
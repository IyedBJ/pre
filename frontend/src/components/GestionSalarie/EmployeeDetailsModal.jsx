import { X, Info, User, Mail, Briefcase, Hash, MapPin, Euro } from "lucide-react";


// eslint-disable-next-line no-unused-vars
// Composant pour afficher une ligne de détail dans le modal de détails d'un projet
const DetailItem = ({ icon: IconComponent, label, value }) => (
  <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-[#7fd959]/30">
    <div className="flex items-center gap-2 text-slate-500">
      <IconComponent className="w-4 h-4" />
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-slate-900 font-medium">{value || "—"}</div>
  </div>
);
// Composant principal du modal de détails d'un employé
export default function EmployeeDetailsModal({ isOpen, onClose, employee }) {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
        
        {/* ── Header ── */}
        <div className="relative h-32 bg-gradient-to-br from-[#7fd959] to-[#6fc847] flex items-end px-8 pb-0">
          <div className="absolute top-6 right-6">
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 translate-y-8 bg-white p-2 rounded-2xl shadow-xl ml-2">
            <img 
              src={employee.avatar || `https://ui-avatars.com/api/?nom=${encodeURIComponent(employee.nom)}&background=random`} 
              alt={employee.nom}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="pr-8">
              <h2 className="text-slate-900 text-xl font-bold leading-tight">{employee.nom}</h2>
              <p className="text-[#7fd959] font-semibold text-sm">{employee.rôle}</p>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-8 pt-16 pb-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem 
              icon={Mail} 
              label="Email Professionnel" 
              value={employee.email} 
            />
            <DetailItem 
              icon={Hash} 
              label="Numéro de Sécurité Sociale" 
              value={employee.numSécu} 
            />
          </div>

          <DetailItem 
            icon={MapPin} 
            label="Adresse de Résidence" 
            value={employee.adresse} 
          />

          <div className="grid grid-cols-1 gap-4">
            <DetailItem 
              icon={Euro} 
              label="TJM de Référence" 
              value={`${employee.tjm?.toLocaleString("fr-FR")} € / jour`} 
            />
          </div>


        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all text-sm shadow-lg shadow-slate-200"
          >
            Fermer l'aperçu
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .animate-fadeIn { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

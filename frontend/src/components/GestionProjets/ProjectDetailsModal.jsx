import { X, Briefcase, User, Building2, Euro, Info, Calendar, FileText } from "lucide-react";
// Composant réutilisable pour afficher une ligne de détail avec une icône, un label et une valeur  

const DetailItem = ({ icon: IconComponent, label, value }) => (
  <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-[#7fd959]/30">
    <div className="flex items-center gap-2 text-slate-500">  
      <IconComponent className="w-4 h-4" />
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-slate-900 font-medium">{value || "—"}</div>
  </div>
);
// Configuration de styles pour les différents statuts de projet      
const statusConfig = {
  "En cours": "bg-blue-100 text-blue-700",
  "Terminé": "bg-emerald-100 text-emerald-700",
  "En pause": "bg-amber-100 text-amber-700",
  "Annulé": "bg-red-100 text-red-700",
};
// Composant principal du modal de détails du projet
export default function ProjectDetailsModal({ isOpen, onClose, project }) {
  // Si le modal n'est pas ouvert ou si aucune donnée de projet n'est fournie, ne rien rendre
  if (!isOpen || !project) return null;

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
            <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-[#7fd959]">
              <Briefcase className="w-10 h-10" />
            </div>
            <div className="pr-8">
              <h2 className="text-slate-900 text-xl font-bold leading-tight">{project.titre}</h2>
              <p className="text-[#7fd959] font-semibold text-sm">{project.référence || "PROJ-LXP"}</p>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-8 pt-16 pb-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem 
              icon={Building2} 
              label="Client" 
              value={project.nomClient} 
            />
            <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-[#7fd959]/30">
              <div className="flex items-center gap-2 text-slate-500">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Consultant Assigné</span>
              </div>
              <div className="flex items-center gap-2">
                {project.employee?.avatar && (
                  <img src={project.employee.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                )}
                <div className="text-slate-900 font-medium">{project.employee?.nom || "Non assigné"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem 
              icon={Euro} 
              label="TJM du Projet" 
              value={`${project.tjm?.toLocaleString("fr-FR")} € / jour`} 
            />
             <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-[#7fd959]/30">
              <div className="flex items-center gap-2 text-slate-500">
                <Info className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">État du projet</span>
              </div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[project.statut] || "bg-slate-100 text-slate-600"}`}>
                  {project.statut}
                </span>
              </div>
            </div>
          </div>

          <DetailItem 
            icon={FileText} 
            label="Description & Remarques" 
            value={project.remarque} 
          />

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

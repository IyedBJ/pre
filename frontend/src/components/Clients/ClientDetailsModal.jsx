import { X, Mail, Phone, Globe, MapPin, Briefcase, TrendingUp, CreditCard, Calendar } from "lucide-react";
import { API_URL } from "../../api/axios";

export default function ClientDetailsModal({ isOpen, onClose, client }) {
  // Si le modal n'est pas ouvert ou si aucun client n'est fourni, ne rien afficher
  if (!isOpen || !client) return null;
  //Formate un nombre en euros (devise EUR) avec la locale française.
  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    // Conteneur principal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
    >
      {/* Conteneur de la fenêtre modale */}
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn border border-slate-200">
        {/* Header with Logo Backdrop */}
        <div className="relative h-32 bg-slate-50 border-b border-slate-100">
          <div className="absolute -bottom-8 left-8 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="h-20 w-20 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
              <img
                // Si l'avatar commence par /api, c'est un chemin relatif du serveur, sinon c'est une URL complète ou null. En cas d'erreur de chargement, on affiche un avatar généré avec le nom du client. 
                src={client.avatar && client.avatar.startsWith('/api') ? `${API_URL}${client.avatar}` : (client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.nom)}&background=random&size=128`)} 
                alt={client.nom} 
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.nom)}&background=random&size=128`;
                }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm transition-all"
          >
            {/* Icone de fermeture */}
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pt-12 pb-8 flex flex-col gap-8">
          {/* Main Info */}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-slate-900">{client.nom}</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{client.codeClient}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                client.statut === "Payé" ? "bg-emerald-100 text-emerald-800" : 
                client.statut === "En retard" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
              }`}>
                {client.statut}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Details */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Coordonnées</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg"><Mail className="w-4 h-4 text-[#7ED957]" /></div>
                  <span className="text-sm truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg"><Phone className="w-4 h-4 text-[#7ED957]" /></div>
                  <span className="text-sm">{client.phone}</span>
                </div>
                {client.url && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-lg"><Globe className="w-4 h-4 text-[#7ED957]" /></div>
                    <a href={client.url.startsWith('http') ? client.url : `https://${client.url}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#7ED957] transition-colors truncate">
                      {client.url}
                    </a>
                  </div>
                )}
                <div className="flex items-start gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg"><MapPin className="w-4 h-4 text-[#7ED957]" /></div>
                  <div className="flex flex-col">
                    <span className="text-sm leading-tight">{client.adresse}</span>
                    <span className="text-sm text-slate-400">{client.codePostal} {client.ville}</span>
                  </div>
                </div>
              </div>

               {/* Identifiers */}
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-2">Identifiants</h3>
               <div className="flex flex-col gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <div className="flex justify-between"><span>SIREN:</span> <span className="font-mono">{client.siren || "—"}</span></div>
                 <div className="flex justify-between"><span>SIRET:</span> <span className="font-mono">{client.siret || "—"}</span></div>
                 <div className="flex justify-between"><span>APE:</span> <span className="font-mono">{client.ape || "—"}</span></div>
                 <div className="flex justify-between"><span>TVA:</span> <span className="font-mono">{client.tva_intra || "—"}</span></div>
               </div>
            </div>

            {/* Financial Stats */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Indicateurs Financiers</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Factures</span>
                    <span className="text-lg font-bold text-slate-900">{client.nombreFactures || 0}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Briefcase className="w-5 h-5 text-[#7ED957]" />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">CA Total (HT)</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(client.totalCaHt || 0)}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Reste à Payer</span>
                    <span className="text-lg font-bold text-rose-600">{formatCurrency(client.montantRestant || 0)}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CreditCard className="w-5 h-5 text-rose-500" />
                  </div>
                </div>
              </div>

              {client.note_public && (
                <div className="mt-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Note</h3>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-slate-700 italic">
                    {client.note_public}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 text-sm"
          >
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

import { X, Receipt, TrendingUp, CreditCard, Calendar, User, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function InvoiceDetailsModal({ isOpen, onClose, invoice }) {
  // Si le modal n'est pas ouvert ou si aucune facture n'est fournie, ne rien afficher
  if (!isOpen || !invoice) return null;

  // Fonction de formatage monétaire pour l'affichage
  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 2  
  }).format(val);


  // Fonction de formatage de la date pour l'affichage (timestamp UNIX en secondes)
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  // Détermine si la facture est payée ou non pour afficher le statut et les couleurs correspondantes
  const isPaid = (invoice.resteAPayer || 0) <= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn border border-slate-200">
        {/* Header */}
        <div className="relative h-24 bg-slate-50 border-b border-slate-100 flex items-center px-8">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm mr-4">
            <Receipt className="w-8 h-8 text-[#7ED957]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900">{invoice.référence}</h2>
            <span className="text-slate-500 text-sm font-medium">Détails de la facture Dolibarr</span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 shadow-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Infos Facture */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Information Facture</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-lg"><Calendar className="w-4 h-4 text-[#7ED957]" /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Date d'émission</span>
                      <span className="text-sm font-medium">{formatDate(invoice.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-lg"><Calendar className="w-4 h-4 text-amber-500" /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Échéance</span>
                      <span className="text-sm font-medium">{formatDate(invoice.dateEchéance)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-lg"><Info className="w-4 h-4 text-blue-500" /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Statut</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isPaid ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-600">Payée</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} className="text-rose-500" />
                            <span className="text-sm font-bold text-rose-600">En attente de règlement</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Client Destinataire</h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#7ED957] font-bold text-lg shadow-sm">
                    {invoice.nomClient?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{invoice.nomClient}</span>
                    <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100 w-fit mt-1">
                      {invoice.codeClient}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Récapitulatif Financier */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Récapitulatif Financier</h3>
              <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col gap-6 shadow-xl">
                <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">Montant Total TTC</span>
                    <span className="text-3xl font-black">{formatCurrency(invoice.total_ttc)}</span>
                </div>
                
                <div className="h-px bg-slate-800 w-full"></div>

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Total HT</span>
                        <span className="font-bold">{formatCurrency(invoice.total_ht)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">TVA</span>
                        <span className="font-bold">{formatCurrency(invoice.total_tva || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                        <span className="text-slate-400">Déjà réglé</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(invoice.total_ttc - invoice.resteAPayer)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base pt-2">
                        <span className="text-slate-300 font-bold">Reste à payer</span>
                        <span className={`font-black ${isPaid ? 'text-emerald-400' : 'text-rose-400 underline underline-offset-4 decoration-rose-400/30'}`}>
                            {formatCurrency(invoice.resteAPayer)}
                        </span>
                    </div>
                </div>
              </div>

              {/* Action hints */}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 text-sm shadow-sm"
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

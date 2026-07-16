import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import { X, Save, FileText, UserPlus, Upload, Loader2 } from "lucide-react";
import api from "../../api/axios";
import Autocomplete from "../Shared/Autocomplete";


/**
 * Modale d'ajout / modification d'un employé.
 * - En mode création : possibilité d'importer une fiche de paie PDF (extraction auto)
 * - En mode édition : pré‑remplissage des champs
 */
export default function AddEmployeeModal({ isOpen, onClose, onSave, editingEmployee, isPayslipMode }) {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    rôle: "",
    idRôle: "",
    tjm: "",
    dateEntree: null,
    numSécu: "",
    adresse: "",
  });

  const [roles, setRoles] = useState([]); // Liste des rôles disponibles pour le dropdown

  const [isExtracting, setIsExtracting] = useState(false);  // État pour indiquer si une extraction de données est en cours
  // Chargement des rôles et pré‑remplissage en mode édition
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/roles");
        setRoles(res.data);
      } catch {
        // Handled by interceptor
      }
    };
    fetchRoles();
    // Si on est en mode édition, pré‑remplir le formulaire avec les données de l'employé à éditer
    if (editingEmployee) {
      setForm({
        nom: editingEmployee.nom || "",
        email: editingEmployee.email || "",
        rôle: editingEmployee.rôle || "",
        idRôle: editingEmployee.idRôle || "",
        tjm: editingEmployee.tjm || "",
        dateEntree: editingEmployee.dateEntree ? new Date(editingEmployee.dateEntree) : null,
        numSécu: editingEmployee.numSécu || "",
        adresse: editingEmployee.adresse || "",
      });
    } else {
    
      setForm({ nom: "", email: "", rôle: "", idRôle: "", tjm: "", dateEntree: null, numSécu: "", adresse: "" });
    }
  }, [editingEmployee, isOpen]);

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  // Validation du formulaire avant soumission
  const validate = () => {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!form.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Email invalide";
    if (!form.rôle) newErrors.rôle = "Le rôle est requis";
    if (!form.tjm || isNaN(Number(form.tjm)) || Number(form.tjm) <= 0) 
      newErrors.tjm = "TJM invalide (nombre positif requis)";
    if (!form.dateEntree) newErrors.dateEntree = "La date est requise";
    return newErrors;
  };
  // Gestion de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Veuillez corriger les erreurs du formulaire.");
      return;
    }

    // Simuler un délai d'enregistrement pour montrer le toast de chargement
    const promise = new Promise((resolve) => setTimeout(resolve, 1200));
    toast.promise(promise, {
      loading: "Enregistrement en cours...",
      success: `${form.nom} a été ajouté avec succès !`,
      error: "Une erreur est survenue.",
    });

    promise.then(() => {
      onSave?.(form);
      setForm({ nom: "", email: "", rôle: "", idRôle: "", tjm: "", dateEntree: null, numSécu: "", adresse: "" });
      setErrors({});
      onClose?.();
    });
  };
  // Fonction pour réinitialiser le formulaire et fermer le modal
  const handleCancel = () => {
    setForm({ nom: "", email: "", rôle: "", idRôle: "", tjm: "", dateEntree: null, numSécu: "", adresse: "" });
    setErrors({});
    onClose?.();
  };
  // Fonction pour gérer l'upload d'une fiche de paie et l'extraction des données
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Envoie le PDF à l’endpoint /upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", "profile");

    setIsExtracting(true);
    const toastId = toast.loading("Extraction des données en cours...");

    try {
      // Appel à l'API pour extraire les données de la fiche de paie
      const res = await api.post("/upload", formData);
      const data = res.data;
      // Mise à jour du formulaire avec les données extraites (en conservant les champs déjà remplis)
      setForm((prev) => ({
        ...prev,
        nom: data.nom || prev.nom,
        numSécu: data.numSécu || prev.numSécu,
        adresse: data.adresse || prev.adresse,
      }));
      toast.success("Données extraites avec succès !", { id: toastId });
    } catch {
       // Handled by axios response interceptor but we might want custom message here
       // toast.error(`Erreur d'extraction: ${error.response?.data?.error || "Erreur inconnue"}`, { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-[640px] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
        
        {/* ── Header ── */}
        <div className="px-8 pt-6 pb-4 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-[#7fd959]" />
              <h2 className="text-slate-900 text-2xl font-bold leading-tight">
                {editingEmployee ? "Modifier le Salarié" : "Ajouter un Salarié"}
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              Configurez le profil du collaborateur pour les prévisions financières.
            </p>
          </div>
          <button
            onClick={handleCancel}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Extraction Section (Optional) ── */}
        {isPayslipMode && !editingEmployee && (
          <div className="px-8 pt-2">
            <div className="bg-[#7fd959]/5 border-2 border-dashed border-[#7fd959]/30 rounded-xl p-3 flex items-center gap-4 transition-all hover:bg-[#7fd959]/10">
              <div className="p-2 bg-white rounded-full shadow-sm">
                {isExtracting ? (
                  <Loader2 className="w-4 h-4 text-[#7fd959] animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-[#7fd959]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-bold text-xs uppercase tracking-wide">Chargez la fiche de paie</p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  PDF supporté. Extraction auto du Nom, Adresse et SSN.
                </p>
              </div>
              <label className="cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 text-[10px] font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2">
                <Upload className="w-3 h-3" />
                {isExtracting ? "Analyse..." : "Parcourir"}
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf" 
                  onChange={handleFileUpload}
                  disabled={isExtracting}
                />
              </label>
            </div>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          
          {/* Row 1 : Nom + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Nom complet <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                placeholder="Ex: Jean Dupont"
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                  errors.nom
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200"
                }`}
              />
              {errors.nom && <p className="text-red-400 text-xs">{errors.nom}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Email professionnel <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="jean.dupont@cabinet.fr"
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                  errors.email
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200"
                }`}
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
            </div>
          </div>

          {/* Row 2 : Rôle + SSN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Autocomplete
              label="Rôle"
              options={roles.map(r => ({ id: r.id, name: r.nom }))}
              value={form.idRôle}
              onChange={(rId) => {
                const roleName = roles.find(r => String(r.id) === String(rId))?.nom || "";
                setForm(prev => ({ ...prev, idRôle: rId, rôle: roleName }));
                if (errors.rôle) setErrors(prev => ({ ...prev, rôle: "" }));
              }}
              placeholder="Sélectionner un rôle"
              error={errors.rôle}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Numéro de sécurité sociale
              </label>
              <input
                type="text"
                value={form.numSécu}
                onChange={(e) => handleChange("numSécu", e.target.value)}
                placeholder="Ex: 1 80 01 75 001 001 01"
                className="w-full h-12 rounded-lg border border-slate-200 px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-700 text-sm font-semibold">
              Adresse
            </label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => handleChange("adresse", e.target.value)}
              placeholder="Ex: 123 Rue de la Paix, Paris"
              className="w-full h-12 rounded-lg border border-slate-200 px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all"
            />
          </div>


          {/* Row 3 : TJM + Date d'entrée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                TJM de référence <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.tjm}
                  onChange={(e) => handleChange("tjm", e.target.value)}
                  placeholder="850"
                  min="0"
                  className={`w-full h-12 rounded-lg border px-4 pr-20 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                    errors.tjm
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-200"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs pointer-events-none">
                  € / jour
                </span>
              </div>
              {errors.tjm && <p className="text-red-400 text-xs">{errors.tjm}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Date d'entrée <span className="text-red-400">*</span>
              </label>
              <DatePicker
                selected={form.dateEntree}
                onChange={(date) => handleChange("dateEntree", date)}
                locale={fr}
                dateFormat="dd/MM/yyyy"
                placeholderText="jj/mm/aaaa"
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                  errors.dateEntree
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200"
                }`}
                wrapperClassName="w-full"
              />
              {errors.dateEntree && (
                <p className="text-red-400 text-xs">{errors.dateEntree}</p>
              )}
            </div>
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-[#7fd959] text-slate-900 font-bold rounded-lg hover:brightness-105 hover:shadow-lg active:scale-95 transition-all text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { width: 100%; }
      `}</style>
    </div>
  );
}

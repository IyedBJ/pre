import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Save, Briefcase, Loader2 } from "lucide-react";
import api from "../../api/axios";
import Autocomplete from "../Shared/Autocomplete";

export default function AddProjectModal({ isOpen, onClose, onSave, editingProject, employees = [], clients = [], loadingData = false }) {
  const [form, setForm] = useState({
    title: "",
    employeeId: "",
    clientDolibarrId: "",
    clientName: "",
    tjm: "",
    status: "En cours",
    marge: "10", // Default margin 10%
    remarque: "",
  });

  const [errors, setErrors] = useState({});
// Effet pour pré-remplir le formulaire en mode édition ou le réinitialiser en mode création
  useEffect(() => {
    // Lorsque le modal s'ouvre en mode édition, pré-remplir le formulaire avec les données du projet à éditer
    if (editingProject) {
      // Mode édition : on copie les valeurs du projet existant
      setForm({
        title: editingProject.titre || "",
        employeeId: editingProject.employee?.id || editingProject.idEmployé || "",
        clientDolibarrId: editingProject.idDolibarrClient || "",
        clientName: editingProject.nomClient || "",
        tjm: editingProject.tjm || "",
        status: editingProject.statut || "En cours",
        marge: editingProject.marge || "10",
        remarque: editingProject.remarque || "",
      });
    } else {
      // Mode création : on réinitialise le formulaire à des valeurs par défaut
      setForm({
        title: "",
        employeeId: "",
        clientDolibarrId: "",
        clientName: "",
        tjm: "",
        status: "En cours",
        marge: "10",
        remarque: "",
      });
    }
  }, [editingProject, isOpen]);

  // Fonction de gestion des changements dans les champs du formulaire 
  const handleChange = (field, value) => {
    setForm((prev) => {
      const nextForm = { ...prev, [field]: value };
      // Si on change le client, on met à jour clientName
      if (field === "clientDolibarrId") {
        const selectedClient = clients.find((c) => String(c.id) === String(value));
        nextForm.clientName = selectedClient ? selectedClient.nom : "";
      }

      // Pour un NOUVEAU projet (pas en édition), si on change employé OU client,
      // on génère automatiquement le titre : "NomEmployé - NomClient"
      if (!editingProject && (field === "employeeId" || field === "clientDolibarrId")) {
        const employee = employees.find((emp) => String(emp.id) === String(nextForm.employeeId));
        const empName = employee ? employee.nom : "";
        const cliName = nextForm.clientName || "";

        if (empName && cliName) {
          nextForm.title = `${empName} - ${cliName}`;
        } else {
          nextForm.title = empName || cliName || "";
        }
      }

      return nextForm;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  // Fonction de validation du formulaire avant soumission
  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Le titre est requis";
    if (!form.employeeId) newErrors.employeeId = "Le salarié est requis";
    if (!form.clientDolibarrId) newErrors.clientDolibarrId = "Le client est requis";
    if (!form.tjm || isNaN(Number(form.tjm)) || Number(form.tjm) < 0)
      newErrors.tjm = "TJM invalide";
    return newErrors;
  };
  // Fonction de gestion de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[640px] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#7fd959]" />
              <h2 className="text-slate-900 text-2xl font-bold leading-tight">
                {editingProject ? "Modifier le Projet" : "Nouveau Projet"}
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              Associez un salarié à un client et définissez les conditions du projet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
            disabled={loadingData}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          {loadingData && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
              <Loader2 className="w-8 h-8 text-[#7fd959] animate-spin" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-700 text-sm font-semibold">Titre du Projet</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Ex: Refonte Frontend, Audit Cloud..."
              className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                errors.title ? "border-red-400" : "border-slate-200"
              }`}
              disabled={loadingData}
            />
            {errors.title && <p className="text-red-400 text-xs">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Autocomplete
              label="Salarié"
              options={employees.map(emp => ({ id: emp.id, name: `${emp.nom} (${emp.rôle})` }))}
              value={form.employeeId}
              onChange={(val) => handleChange("employeeId", val)}
              placeholder="Sélectionner un salarié"
              error={errors.employeeId}
              disabled={loadingData}
            />

            <Autocomplete
              label="Client"
              options={clients.filter(cli => cli.actif !== false).map(cli => ({ id: cli.id, name: cli.nom }))}
              value={form.clientDolibarrId}
              onChange={(val) => handleChange("clientDolibarrId", val)}
              placeholder="Rechercher un client..."
              error={errors.clientDolibarrId}
              disabled={loadingData}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">TJM appliqué</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.tjm}
                  onChange={(e) => handleChange("tjm", e.target.value)}
                  placeholder="850"
                  className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                    errors.tjm ? "border-red-400" : "border-slate-200"
                  }`}
                  disabled={loadingData}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€/j</span>
              </div>
              {errors.tjm && <p className="text-red-400 text-xs">{errors.tjm}</p>}
            </div>

            {editingProject && (
              <Autocomplete
                label="État du Projet"
                options={[
                  { id: "En cours", name: "En cours" },
                  { id: "Terminé", name: "Terminé" },
                  { id: "En pause", name: "En pause" },
                  { id: "Annulé", name: "Annulé" }
                ]}
                value={form.status}
                onChange={(val) => handleChange("status", val)}
                className="w-full"
                disabled={loadingData}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-700 text-sm font-semibold">Marge cible (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.marge}
              onChange={(e) => handleChange("marge", e.target.value)}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7fd959]"
              disabled={loadingData}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>0%</span>
              <span className="text-[#7fd959] text-sm">{form.marge}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-700 text-sm font-semibold">Remarque</label>
            <textarea
              value={form.remarque}
              onChange={(e) => handleChange("remarque", e.target.value)}
              placeholder="Notes ou commentaires additionnels"
              rows={3}
              className="w-full rounded-lg border border-slate-200 p-3 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all resize-y"
              disabled={loadingData}
            ></textarea>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors text-sm"
            disabled={loadingData}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-[#7fd959] text-slate-900 font-bold rounded-lg hover:brightness-105 active:scale-95 transition-all text-sm flex items-center gap-2"
            disabled={loadingData}
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
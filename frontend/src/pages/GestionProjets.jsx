import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Briefcase, Trash2, Edit2, TrendingUp, Clock } from "lucide-react";
import AddProjectModal from "../components/GestionProjets/AddProjectModal";
import ProjectDetailsModal from "../components/GestionProjets/ProjectDetailsModal";
import { useTheme } from "../context/ThemeContext";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import api from "../api/axios";
import Autocomplete from "../components/Shared/Autocomplete";
import Pagination from "../components/Shared/Pagination";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const MySwal = withReactContent(Swal);

const statusConfig = {
  "En cours": "bg-blue-100 text-blue-700",
  "Terminé": "bg-emerald-100 text-emerald-700",
  "En pause": "bg-amber-100 text-amber-700",
  "Annulé": "bg-red-100 text-red-700",
};
// Composant pour afficher le badge de statut dans le tableau 
function StatusBadge({ status }) {
  const colorClass = statusConfig[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
}
// Composant principal de la page de gestion des projets
export default function GestionProjets() {
  const { user } = useAuth();
  const { projects, fetchProjects: refreshProjects } = useData();
  const isReadOnly = user?.role === 'finance';
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous les états");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Fonction pour charger les employés et clients pour les modales
  const fetchModalData = async () => {
    try {
      setLoadingData(true);
      const [empRes, cliRes] = await Promise.all([
        api.get("/employes"),
        api.get("/clients"),
      ]);
      setEmployees(empRes.data);
      setClients(cliRes.data);
    } catch (error) {
      console.error("Erreur chargement données modale:", error);
    } finally {
      setLoadingData(false);
    }
  };
  // Charger les projets et les données nécessaires au montage du composant
  useEffect(() => {
    refreshProjects();
    fetchModalData();
  }, [refreshProjects]);
  // Fonction pour gérer la création ou modification d'un projet
  const handleSave = async (form) => {
    try {
      if (editingProject) {
        // Mise à jour d'un projet existant
        await api.put(`/projets/${editingProject.id}`, form);
        toast.success("Projet modifié");
      } else {
        // Création d'un nouveau projet
        await api.post("/projets", form);
        toast.success("Projet créé");
      }
      refreshProjects();
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };
  // Fonction pour gérer la suppression d'un projet avec confirmation
  const handleDelete = (project) => {
    MySwal.fire({
      title: "Supprimer ce projet ?",
      text: `Voulez-vous vraiment supprimer "${project.titre}" ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/projets/${project.id}`);
          toast.success("Projet supprimé");
          refreshProjects();
        } catch (error) {
          toast.error(error.formattedMessage || "Erreur lors de la suppression");
        }

      }
    });
  };
  // Fonction pour ouvrir le modal de détails d'un projet
  const openDetails = (project) => {
    setSelectedProjectForDetails(project);
    setIsDetailsModalOpen(true);
  };
  // Fonction pour fermer le modal de détails d'un projet
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProjectForDetails(null);
  };
  // Filtrage des projets en fonction de la recherche et du filtre de statut
  const filtered = projects.filter((p) => {
    const matchSearch = 
      p.titre?.toLowerCase().includes(search.toLowerCase()) ||
      p.nomClient?.toLowerCase().includes(search.toLowerCase()) ||
      p.employe?.nom?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === "Tous les états" || p.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE); // Calcul de l'index de départ pour la pagination et extraction des projets à afficher
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;  // Extraction des projets à afficher sur la page courante
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);  // Calcul de statistiques pour les cartes en haut de la page

  const activeProjects = projects.filter(p => p.statut === "En cours").length; // Calcul de la marge moyenne en évitant la division par zéro
  const avgMargin = projects.length > 0  // Calcul de la marge moyenne en évitant la division par zéro
    ? Math.round(projects.reduce((acc, p) => acc + (p.marge || 0), 0) / projects.length) // Calcul de la marge moyenne en évitant la division par zéro
    : 0;

  return (
    <div className={`text-slate-900 font-sans transition-colors min-h-screen p-4 md:p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'}`}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isReadOnly ? 'Projets' : 'Gestion des Projets'}
          </h1>
          <p className="text-slate-600 dark:text-gray-400 font-medium mt-1">
            Pilotez l'affectation de vos consultants et la rentabilité de vos missions.
          </p>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="bg-[#7ED957] hover:bg-[#6ec948] text-slate-900 font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm w-fit active:scale-95"
          >
            <Briefcase className="w-5 h-5" />
            Ajouter un projet
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Projets Actifs</span>
            <div className="text-2xl font-bold text-slate-900">{activeProjects}</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Marge Moyenne</span>
            <div className="text-2xl font-bold text-slate-900">{avgMargin}%</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-slate-200 dark:border-gray-700 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par projet, client ou salarié..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-sm"
            />
          </div>
          <div className="flex items-end">
            <Autocomplete
              options={[
                { id: "Tous les états", name: "Tous les états" },
                { id: "En cours", name: "En cours" },
                { id: "Terminé", name: "Terminé" },
                { id: "En pause", name: "En pause" },
                { id: "Annulé", name: "Annulé" }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
              placeholder="Statut..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-700">
                {["Projet", "Salarié Assigné", "Client", "TJM États", "État du projet", ""].map((h, i) => (
                  <th key={i} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400 text-sm">Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400 text-sm">Aucun projet trouvé</td></tr>
              ) : (
                paginated.map((prj) => (
                  <tr 
                    key={prj.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openDetails(prj)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-slate-900">{prj.titre}</div>
                      <div className="text-xs text-slate-400">{prj.référence}</div>
                      {prj.remarque && <div className="text-xs text-slate-500 italic mt-1 line-clamp-2">{prj.remarque}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {prj.employe?.avatar && (
                          <img src={prj.employe.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        )}
                        <span className="text-sm text-slate-700">{prj.employe?.nom || "Non assigné"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {prj.nomClient}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {prj.tjm} €<span className="text-[10px] text-slate-400 ml-1">/j</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={prj.statut} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isReadOnly && (
                        <div className="flex justify-end gap-2 text-slate-400">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingProject(prj); setIsModalOpen(true); }} 
                            className="hover:text-[#7ED957]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(prj); }} 
                            className="hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          label="projets"
        />
      </div>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingProject={editingProject}
        employees={employees}
        clients={clients}
        loadingData={loadingData}
      />

      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        project={selectedProjectForDetails}
      />
    </div>
  );
}

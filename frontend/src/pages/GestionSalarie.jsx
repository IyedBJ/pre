import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { UserPlus, Trash2, Edit2 } from "lucide-react";
import AddEmployeeModal from "../components/GestionSalarie/AddEmployeeModal";
import EmployeeDetailsModal from "../components/GestionSalarie/EmployeeDetailsModal";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Autocomplete from "../components/Shared/Autocomplete";
import Pagination from "../components/Shared/Pagination";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const MySwal = withReactContent(Swal);

// Page principale de gestion des salariés
export default function GestionSalarie() {
  const { user } = useAuth();
  const { employees, fetchEmployees: refreshEmployees } = useData();
  const isReadOnly = user?.role === 'finance';
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isPayslipMode, setIsPayslipMode] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState(null);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous les rôles");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Fonction pour récupérer les rôles disponibles depuis l'API (on peut garder localement ou mettre dans context plus tard)
  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data);
    } catch {
      // Handled
    }
  };
  // useEffect pour charger les employés et les rôles au montage du composant
  useEffect(() => {
    refreshEmployees();
    fetchRoles();
  }, [refreshEmployees]);
  // useEffect pour réinitialiser la page courante à 1 lorsque les filtres de recherche ou de rôle changent
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);
  // Fonction pour ouvrir le modal d'édition avec les données de l'employé sélectionné
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsPayslipMode(false);
    setIsModalOpen(true);
  };
  // Fonction pour fermer le modal d'ajout/édition et réinitialiser les états associés
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setIsPayslipMode(false);
  };  
  // Fonction pour ouvrir le modal de détails d'un employé
  const openDetails = (employee) => {
    setSelectedEmployeeForDetails(employee);
    setIsDetailsModalOpen(true);
  };
  // Fonction pour fermer le modal de détails et réinitialiser l'état associé
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEmployeeForDetails(null);
  };

  const filtered = employees.filter((e) => {
    const nameMatch = e.nom?.toLowerCase().includes(search.toLowerCase()) || false;
    const roleMatch = e.rôle?.toLowerCase().includes(search.toLowerCase()) || false;
    
    const matchSearch = nameMatch || roleMatch;
    const matchRole = roleFilter === "Tous les rôles" || e.rôle === roleFilter;
    
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSave = async (form) => {
    const payload = {
      nom: form.nom,
      email: form.email,
      rôle: form.rôle,
      idRôle: form.idRôle,
      numSécu: form.numSécu,
      adresse: form.adresse,
      tjm: Number(form.tjm),
      avatar: editingEmployee ? editingEmployee.avatar : `https://ui-avatars.com/api/?nom=${encodeURIComponent(form.nom)}&background=random`,
    };

    try {
      if (editingEmployee) {
        await api.put(`/employes/${editingEmployee.id}`, payload);
      } else {
        await api.post("/employes", payload);
      }
      
      toast.success(editingEmployee ? "Modifié avec succès" : "Ajouté avec succès");
      refreshEmployees();
      closeModal();
    } catch (error) {
      toast.error(error.formattedMessage || "Erreur durant l'enregistrement", { duration: 5000 });
      console.error(error);
    }

  };

  const handleDelete = (employee) => {
    MySwal.fire({
      title: "Êtes-vous sûr ?",
      text: `Vous allez supprimer ${employee.nom}. Cette action est irréversible !`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/employes/${employee.id}`);
          toast.success("Salarié supprimé avec succès");
          refreshEmployees();
        } catch (error) {
          toast.error(error.formattedMessage || "Erreur lors de la suppression");
          console.error(error);
        }

      }
    });
  };

  const avgTjm = employees.length > 0 
    ? Math.round(employees.reduce((acc, emp) => acc + (Number(emp.tjm) || 0), 0) / employees.length)
    : 0;

  return (
    <div className={`text-slate-900 font-sans transition-colors min-h-screen p-4 md:p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'}`}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isReadOnly ? 'Salariés' : 'Gestion des Salariés'}
          </h1>
          <p className="text-slate-600 dark:text-gray-400 font-medium mt-1">
            Suivez la rentabilité et l'affectation des ressources de vos équipes de conseil.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => { setIsPayslipMode(false); setIsModalOpen(true); }}
              className="bg-[#7ED957] hover:bg-[#6ec948] text-slate-900 font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm w-fit active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un salarié manuellement
            </button>

            <button 
              onClick={() => { setIsPayslipMode(true); setIsModalOpen(true); }}
              className="bg-[#7ED957] hover:bg-[#6ec948] text-slate-900 font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm w-fit active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un salarié par fiche de paie
            </button>
          </div>
        )}
      </div>


      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-slate-200 dark:border-gray-700 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou rôle..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-sm text-slate-900 transition-colors"
            />
          </div>
          <div className="flex items-end text-slate-900 transition-colors">
            <Autocomplete
              options={[
                { id: "Tous les rôles", name: "Tous les rôles" },
                ...roles.map(role => ({ id: role.nom, name: role.nom }))
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              className="w-full"
              placeholder="Rôle..."
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
                {["Nom du Salarié", "Rôle", "TJM de réf.", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "" ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openDetails(emp)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.nom} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-sm text-slate-900">{emp.nom}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{emp.rôle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {emp.tjm?.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {!isReadOnly && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}
                          className="text-slate-400 hover:text-[#7fd959] transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(emp); }}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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
          label="salariés"
        />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TJM Moyen */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">TJM Moyen Total</span>
            <svg className="w-5 h-5 text-[#7ED957]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgTjm.toLocaleString("fr-FR")} €</div>
          <div className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Calculé sur {employees.length} salariés
          </div>
        </div>

      </div>


      <AddEmployeeModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSave={handleSave} 
        editingEmployee={editingEmployee}
        isPayslipMode={isPayslipMode}
      />

      <EmployeeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        employee={selectedEmployeeForDetails}
      />
    </div>
  );
}
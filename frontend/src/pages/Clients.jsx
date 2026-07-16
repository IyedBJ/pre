import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import ClientStats from "../components/Clients/ClientStats";
import ClientTableRow from "../components/Clients/ClientTableRow";
import ClientDetailsModal from "../components/Clients/ClientDetailsModal";
import Autocomplete from "../components/Shared/Autocomplete";
import api from "../api/axios";
import Pagination from "../components/Shared/Pagination";
import { useAuth } from "../context/AuthContext";

export default function Clients() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'finance';
  const { theme } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous les statuts");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Fonction pour récupérer les clients depuis l'API
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clients");
      
      if (Array.isArray(res.data)) {
        setClients(res.data);
      } else {
        setClients([]);
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };
  // Effet pour charger les clients au montage du composant

  useEffect(() => {
    fetchClients();
  }, []);
  // Effet pour réinitialiser la pagination à la page 1 à chaque changement de recherche ou de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);
  // Fonction pour ouvrir la modale de détails d'un client

  const handleOpenDetails = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };
  // Filtrage des clients selon la recherche et le filtre de statut
  const filtered = clients.filter((c) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      c.nom?.toLowerCase().includes(searchLower) ||
      c.codeClient?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower);
    
    const isPaid = (c.montantRestant || 0) <= 0;
    const currentStatus = isPaid ? "Payé" : "Impayé";
    const matchesStatus = statusFilter === "Tous les statuts" || currentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage); // Calcul du nombre total de pages
  const indexOfLastItem = currentPage * itemsPerPage; // Index du dernier élément de la page actuelle
  const indexOfFirstItem = indexOfLastItem - itemsPerPage; // Index du premier élément de la page actuelle
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem); // Clients à afficher sur la page actuelle

  const totalCA = clients.reduce((acc, c) => acc + (c.totalCaHt || 0), 0); // Somme du chiffre d'affaires total (HT) de tous les clients
  const totalOutstanding = clients.reduce((acc, c) => acc + (c.montantRestant || 0), 0);  // Somme des montants restants (encours) de tous les clients
  
  // Compte les zones géographiques : pays différents
  const uniqueRegions = [...new Set(clients.map(c => c.country_code || c.codePays).filter(Boolean))].length;
  // Fonction de formatage monétaire pour l'affichage
  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(val);

  return (
    <div className={`text-slate-900 antialiased font-sans p-4 md:p-8 transition-colors min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'}`}>
      <Toaster position="top-right" />

      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-8">
        
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
            {isReadOnly ? 'Clients' : 'Clients'}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-base">
            Pilotage financier et suivi des encours clients en temps réel.
          </p>
        </div>

        <ClientStats 
          clientsCount={clients.length}
          totalCA={totalCA}
          totalOutstanding={totalOutstanding}
          uniqueRegions={uniqueRegions}
          formatCurrency={formatCurrency}
        />
        


        
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm transition-colors">
          <div className="relative w-full lg:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-gray-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client ou email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-slate-900 dark:text-gray-100 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-end">
            <Autocomplete
              options={[
                { id: "Tous les statuts", name: "Tous les statuts" },
                { id: "Payé", name: "Payé" },
                { id: "Impayé", name: "Impayé" }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
              placeholder="Statut..."
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Factures</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">CA Total (HT)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Solde</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                {currentItems.map((client) => (
                  <ClientTableRow 
                    key={client.id}
                    client={client}
                    formatCurrency={formatCurrency}
                    onOpenDetails={handleOpenDetails}
                  />
                ))}

                {currentItems.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-gray-500">
                        <AlertCircle size={40} strokeWidth={1.5} />
                        <p className="text-sm">Aucun client ne correspond à votre recherche.</p>
                      </div>
                    </td>
                  </tr>
                )}
                
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-500 dark:text-gray-400">
                         <div className="w-5 h-5 border-2 border-[#7ED957] border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-sm font-medium">Chargement des données...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            label="clients"
          />
        </div>
      </div>

      <ClientDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        client={selectedClient} 
      />
    </div>
  );
}

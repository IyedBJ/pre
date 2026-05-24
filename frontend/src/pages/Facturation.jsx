import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Eye
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Autocomplete from "../components/Shared/Autocomplete";
import InvoiceDetailsModal from "../components/Facturation/InvoiceDetailsModal";
import FacturationStats from "../components/Facturation/FacturationStats";
import FacturationTableRow from "../components/Facturation/FacturationTableRow";
import { useTheme } from "../context/ThemeContext";
import Pagination from "../components/Shared/Pagination";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/axios";

export default function Facturation() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'finance';
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("Tous les clients");
  const [statusFilter, setStatusFilter] = useState("Tous les statuts");
  const [yearFilter, setYearFilter] = useState("Toutes les années");
  const [monthFilter, setMonthFilter] = useState("Tous les mois");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Fonction pour récupérer les factures et clients depuis l'API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, cliRes] = await Promise.all([
        fetch(`${API_URL}/api/factures`),
        fetch(`${API_URL}/api/clients`)
      ]);
      
      const invData = await invRes.json();
      const cliData = await cliRes.json();
      
      if (Array.isArray(invData)) setInvoices(invData);
      if (Array.isArray(cliData)) setClients(cliData);
      
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  // Effet pour charger les factures et clients au montage du composant
  useEffect(() => {
    fetchData();
  }, []);
  // Effet pour réinitialiser la pagination à la page 1 à chaque changement de recherche ou de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [search, clientFilter, statusFilter, yearFilter, monthFilter]);

  // Fonction pour filtrer les factures en fonction des critères de recherche
  const filtered = invoices
    // Tri par date DESC
    .sort((a, b) => new Date(b.date * 1000) - new Date(a.date * 1000))
    .filter((inv) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      inv.référence?.toLowerCase().includes(searchLower) ||
      inv.nomClient?.toLowerCase().includes(searchLower) ||
      inv.codeClient?.toLowerCase().includes(searchLower);
    // Filtrage par client : soit "Tous les clients", soit correspondance exacte du nom du client
    const matchesClient = clientFilter === "Tous les clients" || inv.nomClient === clientFilter;
    
    const isPaid = inv.resteAPayer <= 0;
    const statusText = isPaid ? "Payé" : "Non payé";
    const matchesStatus = statusFilter === "Tous les statuts" || statusText === statusFilter;

    const invDate = new Date(inv.date * 1000);
    const matchesYear = yearFilter === "Toutes les années" || invDate.getFullYear().toString() === yearFilter;
    
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const matchesMonth = monthFilter === "Tous les mois" || monthNames[invDate.getMonth()] === monthFilter;

    return matchesSearch && matchesClient && matchesStatus && matchesYear && matchesMonth;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage); // Calcul du nombre total de pages
  const indexOfLastItem = currentPage * itemsPerPage; // Index du dernier élément de la page actuelle
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;    // Index du premier élément de la page actuelle
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem); // Eléments de la page actuelle

  const totalHT = filtered.reduce((acc, inv) => acc + (inv.total_ht || 0), 0);  // Calcul du total HT
  const totalPaid = filtered.reduce((acc, inv) => acc + (inv.total_ttc - inv.resteAPayer), 0); // Calcul du total payé
  const totalOutstanding = filtered.reduce((acc, inv) => acc + (inv.resteAPayer || 0), 0);  // Calcul du total restant à payer

  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(val);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR');
  };

  // Fonction pour récupérer les informations d'un client à partir de son ID
  const getClientInfo = (clientId) => {
    return clients.find(c => c.id === clientId) || {};
  };
  // Extraction des valeurs uniques pour les filtres de client, année et mois
  const uniqueClients = [...new Set(invoices.map(i => i.nomClient))].sort();
  const uniqueYears = [...new Set(invoices.map(i => new Date(i.date * 1000).getFullYear()))].sort((a,b) => b-a);
  const uniqueMonths = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const handleOpenDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  return (
    <div className={`text-slate-900 antialiased font-sans p-4 md:p-8 transition-colors min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'}`}>
      <Toaster position="top-right" />

      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-8">
        
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
            {isReadOnly ? 'Factures' : 'Gestion Facturation'}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-base">
            Pilotage financier et suivi des encaissements en temps réel.
          </p>
        </div>

        <FacturationStats
          totalHT={totalHT}
          totalPaid={totalPaid}
          totalOutstanding={totalOutstanding}
          filteredCount={filtered.length}
          formatCurrency={formatCurrency}
        />

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="relative w-full lg:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une facture ou client..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full">
            <div className="flex items-end">
              <Autocomplete
                options={[
                  { id: "Tous les clients", name: "Tous les clients" },
                  ...uniqueClients.map(c => ({ id: c, name: c }))
                ]}
                value={clientFilter}
                onChange={setClientFilter}
                className="w-full"
                placeholder="Client..."
              />
            </div>
            <div className="flex items-end">
              <Autocomplete
                options={[
                  { id: "Tous les statuts", name: "Tous les statuts" },
                  { id: "Payé", name: "Payé" },
                  { id: "Non payé", name: "Non payé" }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full"
                placeholder="Statut..."
              />
            </div>
            <div className="flex items-end">
              <Autocomplete
                options={[
                  { id: "Toutes les années", name: "Toutes les années" },
                  ...uniqueYears.map(y => ({ id: String(y), name: String(y) }))
                ]}
                value={yearFilter}
                onChange={setYearFilter}
                className="w-full"
                placeholder="Année..."
              />
            </div>
            <div className="flex items-end">
              <Autocomplete
                options={[
                  { id: "Tous les mois", name: "Tous les mois" },
                  ...uniqueMonths.map(m => ({ id: m, name: m }))
                ]}
                value={monthFilter}
                onChange={setMonthFilter}
                className="w-full"
                placeholder="Mois..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Facture</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Montant HT</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Solde</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                {currentItems.map((inv) => (
                  <FacturationTableRow 
                    key={inv.id}
                    invoice={inv}
                    clientInfo={getClientInfo(inv.idClient)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    onOpenDetails={handleOpenDetails}
                  />
                ))}

                {currentItems.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <AlertCircle size={40} strokeWidth={1.5} />
                        <p className="text-sm">Aucun document ne correspond à votre recherche.</p>
                      </div>
                    </td>
                  </tr>
                )}
                
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-500">
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
            label="documents"
          />
        </div>
      </div>

      <InvoiceDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        invoice={selectedInvoice} 
      />
    </div>
  );
}


import { useState, useEffect } from 'react';
import { RefreshCw, Sun, Moon, Bell, Mail, Check, Loader2, Plus, Pencil, Trash2, X, Bot, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

import { useTheme } from '../context/ThemeContext';

import api from '../api/axios';

const Paramètres = () => {
  const { theme, toggleTheme } = useTheme();

  // États pour la gestion des rôles
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ nom: '', description: '' });
  const [editingRole, setEditingRole] = useState(null);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ROLES_PER_PAGE = 5;

  // États pour Groq API Key
  const [groqKey, setGroqKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [isManualModel, setIsManualModel] = useState(false);
  
  const [dolibarrUrl, setDolibarrUrl] = useState('');
  const [dolibarrKey, setDolibarrKey] = useState('');

  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [isSavingDolibarr, setIsSavingDolibarr] = useState(false);

  // Filtrage et Pagination
  const filteredRoles = roles.filter(role => 
    role.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredRoles.length / ROLES_PER_PAGE);
  const paginatedRoles = filteredRoles.slice((currentPage - 1) * ROLES_PER_PAGE, currentPage * ROLES_PER_PAGE);


  useEffect(() => {
    fetchRoles();
    fetchAppConfigs();
  }, []);

  const fetchAppConfigs = async () => {
    try {
      const [keyRes, modelRes, dolibarrUrlRes, dolibarrKeyRes] = await Promise.all([
        api.get('/configurations/GROQ_API_KEY'),
        api.get('/configurations/GROQ_MODEL'),
        api.get('/configurations/DOLIBARR_API_URL'),
        api.get('/configurations/DOLIBARR_API_KEY')
      ]);
      
      if (keyRes.data.value) setGroqKey(keyRes.data.value);
      if (modelRes.data.value) {
        setGroqModel(modelRes.data.value);
        // On ne force plus isManualModel ici pour permettre l'affichage en liste
      }
      if (dolibarrUrlRes.data.value) setDolibarrUrl(dolibarrUrlRes.data.value);
      if (dolibarrKeyRes.data.value) setDolibarrKey(dolibarrKeyRes.data.value);
    } catch (error) {
      console.error("Erreur lors de la récupération des configurations", error);
    }
  };

  const handleGroqKeySubmit = async (e) => {
    e.preventDefault();
    if (!groqKey.trim()) return;

    setIsSavingKey(true);
    const toastId = toast.loading('Sauvegarde de la clé API...');
    try {
      await api.post('/configurations', {
        key: 'GROQ_API_KEY',
        value: groqKey,
        description: 'Clé API pour le chatbot Groq'
      });
      toast.success('Clé API sauvegardée !', { id: toastId });
      fetchAppConfigs(); // Rafraîchir
    } catch {
      toast.error('Erreur lors de la sauvegarde de la clé', { id: toastId });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleGroqModelChange = async (newModel) => {
    if (newModel === 'manual') {
      setIsManualModel(true);
      return;
    }
    
    setIsManualModel(false);
    setGroqModel(newModel);
    setIsSavingModel(true);
    const toastId = toast.loading('Mise à jour du modèle...');
    try {
      await api.post('/configurations', {
        key: 'GROQ_MODEL',
        value: newModel,
        description: 'Modèle utilisé par le chatbot Groq'
      });
      toast.success('Modèle mis à jour !', { id: toastId });
    } catch {
      toast.error('Erreur lors du changement de modèle', { id: toastId });
    } finally {
      setIsSavingModel(false);
    }
  };

  const handleManualModelSave = async () => {
    if (!groqModel.trim()) return;
    setIsSavingModel(true);
    const toastId = toast.loading('Sauvegarde du modèle personnalisé...');
    try {
      await api.post('/configurations', {
        key: 'GROQ_MODEL',
        value: groqModel,
        description: 'Modèle personnalisé pour le chatbot Groq'
      });
      toast.success('Modèle personnalisé enregistré !', { id: toastId });
      setIsManualModel(false);
    } catch {
      toast.error('Erreur lors de la sauvegarde', { id: toastId });
    } finally {
      setIsSavingModel(false);
    }
  };

  const handleDolibarrConfigSubmit = async (e) => {
    e.preventDefault();
    setIsSavingDolibarr(true);
    const toastId = toast.loading('Sauvegarde de la configuration Dolibarr...');
    try {
      await Promise.all([
        api.post('/configurations', { key: 'DOLIBARR_API_URL', value: dolibarrUrl, description: 'URL de l\'API Dolibarr' }),
        api.post('/configurations', { key: 'DOLIBARR_API_KEY', value: dolibarrKey, description: 'Clé API Dolibarr' })
      ]);
      toast.success('Configuration Dolibarr sauvegardée !', { id: toastId });
      fetchAppConfigs();
    } catch {
      toast.error('Erreur lors de la sauvegarde', { id: toastId });
    } finally {
      setIsSavingDolibarr(false);
    }
  };

  // Le bouton "Vider la base" a été intentionnellement retiré. 
  // L'archivage (soft-delete) se fait désormais automatiquement via la synchronisation.

  const fetchRoles = async () => {
    setIsRolesLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
      setCurrentPage(1);
    } catch {
      // Handled by interceptor
    } finally {
      setIsRolesLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setNewRole({ nom: '', description: '' });
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!newRole.nom.trim()) return;

    try {
      editingRole 
        ? await api.put(`/roles/${editingRole.id}`, newRole)
        : await api.post('/roles', newRole);

      toast.success(editingRole ? 'Rôle mis à jour' : 'Rôle ajouté');
      cancelEdit();
      fetchRoles();
    } catch {
      // Handled by interceptor
    }
  };

  const deleteRole = async (id) => {
    MySwal.fire({
      title: 'Supprimer ce rôle ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/roles/${id}`);
          toast.success('Rôle supprimé');
          fetchRoles();
        } catch (error) {
          toast.error(error.formattedMessage || "Erreur lors de la suppression du rôle");
        }

      }
    });
  };

  const handleEditRole = (role) => {
    MySwal.fire({
      title: 'Modifier le rôle',
      html: `
        <div class="text-left p-2">
          <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Nom du rôle</label>
          <input id="swal-name" class="w-full h-12 rounded-lg border border-gray-200 px-4 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium" placeholder="Nom" value="${role.nom || ''}">
          
          <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Description</label>
          <input id="swal-desc" class="w-full h-12 rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium" placeholder="Description" value="${role.description || ''}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#16a34a',
      preConfirm: () => {
        const nom = document.getElementById('swal-name').value;
        const description = document.getElementById('swal-desc').value;
        if (!nom) {
          Swal.showValidationMessage('Le nom est obligatoire');
        }
        return { nom, description };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put(`/roles/${role.id}`, result.value);
          toast.success('Rôle mis à jour');
          fetchRoles();
        } catch {
          // Handled by interceptor
        }
      }
    });
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // Handlers
  const handleSyncSubmit = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    const toastId = toast.loading('Synchronisation avec Dolibarr en cours...');
    try {
      await api.post('/sync');
      toast.success('Base de données synchronisée !', { id: toastId });
    } catch {
      toast.error('Erreur lors de la synchronisation', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Paramètres</h1>

      <div className="space-y-8">
        
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Configuration Dolibarr</h2>
          <form onSubmit={handleDolibarrConfigSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">URL de l'API Dolibarr</label>
                <input
                  type="text"
                  placeholder="https://votre-dolibarr.com/api/index.php"
                  value={dolibarrUrl}
                  onChange={(e) => setDolibarrUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50 dark:bg-gray-900 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Clé API Dolibarr</label>
                <input
                  type="password"
                  placeholder="MaCléSecrète..."
                  value={dolibarrKey}
                  onChange={(e) => setDolibarrKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50 dark:bg-gray-900 text-sm transition-all"
                />
              </div>
            </div>
            <div className="flex justify-start">
              <button
                type="submit"
                disabled={isSavingDolibarr}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition shadow-sm font-medium ${
                  isSavingDolibarr 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSavingDolibarr ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{isSavingDolibarr ? 'Sauvegarde...' : 'Enregistrer la configuration'}</span>
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Synchroniser avec Dolibarr</h2>
          <form onSubmit={handleSyncSubmit} className="space-y-4">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Cette action permet de rafraîchir la base de données locale avec les dernières informations de Dolibarr (clients et factures). 
              L'application restera fonctionnelle avec ces données même sans accès à Dolibarr.
            </p>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSyncing}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition shadow-sm ${
                  isSyncing 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                <span>{isSyncing ? 'Synchronisation...' : 'Lancer la synchronisation'}</span>
              </button>
            </div>
          </form>
        </section>


        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Gestion des roles de salariés</h2>
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Rechercher un rôle..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50 dark:bg-gray-900 transition-all"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          
          {/* Liste des rôles */}
          <div className="mb-6 overflow-hidden border border-gray-100 dark:border-gray-700 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-black text-gray-600 dark:text-gray-400 font-medium transition-colors">
                <tr>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isRolesLoading ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Chargement des rôles...
                      </div>
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400">
                      {searchQuery ? "Aucun rôle ne correspond à votre recherche." : "Aucun rôle défini."}
                    </td>
                  </tr>
                ) : (

                  paginatedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{role.nom}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{role.description || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteRole(role.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {!isRolesLoading && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong> — {filteredRoles.length} rôle{filteredRoles.length > 1 ? 's' : ''}
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        page === currentPage
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr className="my-6 border-gray-100 dark:border-gray-700" />

          {/* Formulaire d'ajout/modification */}
          <form onSubmit={handleRoleSubmit} className={`space-y-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {editingRole ? 'Modifier le rôle' : 'Ajouter un nouveau rôle'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nom du rôle</label>
                <input
                  type="text"
                  placeholder="Ex: Consultant Senior"
                  value={newRole.nom}
                  onChange={(e) => setNewRole({ ...newRole, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Description</label>
                <input
                  type="text"
                  placeholder="Description optionnelle"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
            </div>
        

            <div className="flex justify-end gap-2 pt-2">
              {editingRole && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X size={16} />
                  Annuler
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
              >
                {editingRole ? <Check size={16} /> : <Plus size={16} />}
                {editingRole ? 'Mettre à jour' : 'Ajouter le rôle'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Bot size={24} />
            </div>
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Configuration Intelligence Artificielle</h2>
          </div>
          
          <form onSubmit={handleGroqKeySubmit} className="space-y-4">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Configurez la clé API Groq pour activer les fonctionnalités du chatbot et des prévisions IA. 
            
            </p>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Clé API Groq</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 dark:bg-gray-900 text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={isSavingKey || !groqKey || groqKey.includes('*')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition shadow-sm font-medium ${
                    isSavingKey || !groqKey || groqKey.includes('*')
                      ? 'bg-gray-400 cursor-not-allowed text-white' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isSavingKey ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{isSavingKey ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              <label className="text-xs font-bold text-gray-500 uppercase">Modèle de langage (Chatbot)</label>
              <div className="flex gap-2">
                <select
                  value={isManualModel ? 'manual' : groqModel}
                  onChange={(e) => handleGroqModelChange(e.target.value)}
                  disabled={isSavingModel}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 dark:bg-gray-900 text-sm transition-all outline-none"
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Plus performant)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Plus rapide)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B 32768</option>
                  
                  {/* Option dynamique pour le modèle personnalisé actuel s'il n'est pas dans la liste */}
                  {groqModel && !['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'].includes(groqModel) && groqModel !== 'manual' && (
                    <option value={groqModel}>{groqModel} (Personnalisé)</option>
                  )}

                  <option value="manual">Saisie manuelle...</option>
                </select>
                {isSavingModel && !isManualModel && (
                  <div className="flex items-center px-3">
                    <Loader2 size={18} className="animate-spin text-purple-600" />
                  </div>
                )}
              </div>
              
              {isManualModel && (
                <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                  <input
                    type="text"
                    value={groqModel}
                    onChange={(e) => setGroqModel(e.target.value)}
                    placeholder="Entrez l'ID du modèle (ex: llama-4-pro)"
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50 dark:bg-gray-900 text-sm transition-all outline-none"
                  />
                  <button
                    onClick={handleManualModelSave}
                    disabled={isSavingModel || !groqModel.trim()}
                    className="px-4 py-2 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-bold hover:bg-purple-200 transition-colors flex items-center gap-2"
                  >
                    {isSavingModel ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Enregistrer
                  </button>
                </div>
              )}
            </div>
          </form>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Préférences</h2>
          <div className="space-y-6">
            {/* Thème - avec boutons visuels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thème</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                    theme === 'light'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun size={18} />
                  <span>Clair</span>
                </button>
                <button
                  type="button"
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                    theme === 'dark'
                      ? 'border-green-500 bg-green-900/30 text-green-400'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon size={18} />
                  <span>Sombre</span>
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default Paramètres;
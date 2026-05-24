import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const DataContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  return useContext(DataContext);
};
// Conserve les données mensuelles triées par mois décroissant
const sortMonthlyData = (entries = []) => {
  return [...entries].sort((a, b) => String(b.mois || b.month || '').localeCompare(String(a.mois || a.month || '')));
};
// Associe les données mensuelles à chaque employé

const attachMonthlyDataToEmployees = (employeeList = [], entries = []) => {
  return employeeList.map((employee) => ({
    ...employee,
    monthlyData: sortMonthlyData(
      entries.filter((entry) => String(entry.idEmployé) === String(employee.id))
    )
  }));
};

// Fournit les données globales de l'application (employés, projets, données mensuelles) et les fonctions pour les manipuler

export const DataProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const monthlyDataRef = useRef([]);

  useEffect(() => {
    monthlyDataRef.current = monthlyData;
  }, [monthlyData]);

  const fetchMonthlyData = useCallback(async () => {
    try {
      const res = await api.get('/donnees-mensuelles');
      const entries = Array.isArray(res.data) ? sortMonthlyData(res.data) : [];
      monthlyDataRef.current = entries;
      setMonthlyData(entries);
      setEmployees((prevEmployees) => attachMonthlyDataToEmployees(prevEmployees, entries));
      return entries;
    } catch {
      monthlyDataRef.current = [];
      setMonthlyData([]);
      return [];
    }
  }, []);

  const fetchEmployees = useCallback(async (existingMonthlyData) => {
    try {
      const res = await api.get('/employes');
      const employeeList = Array.isArray(res.data) ? res.data : [];
      const entriesToUse = Array.isArray(existingMonthlyData) ? existingMonthlyData : monthlyDataRef.current;
      const mergedEmployees = attachMonthlyDataToEmployees(employeeList, entriesToUse);
      setEmployees(mergedEmployees);
      return mergedEmployees;
    } catch {
      return [];
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projets');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Error handled by interceptor
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [entries] = await Promise.all([fetchMonthlyData(), fetchProjects()]);
        await fetchEmployees(entries);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      console.log("Background refresh...");
      fetchMonthlyData().then((entries) => {
        fetchProjects();
        fetchEmployees(entries);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchEmployees, fetchMonthlyData, fetchProjects]);

  const upsertLocalMonthlyData = (savedEntry) => {
    setMonthlyData((prevData) => {
      const nextData = prevData.filter(
        (entry) => !(
          String(entry.idEmployé) === String(savedEntry.idEmployé) && 
          entry.mois === savedEntry.mois &&
          String(entry.idProjet) === String(savedEntry.idProjet)
        )
      );
      return sortMonthlyData([...nextData, savedEntry]);
    });

    setEmployees((prevEmployees) =>
      prevEmployees.map((emp) => {
        if (String(emp.id) !== String(savedEntry.idEmployé)) {
          return emp;
        }

        const existingEntries = Array.isArray(emp.monthlyData) ? emp.monthlyData : [];
        const nextEntries = existingEntries.filter((entry) => !(entry.mois === savedEntry.mois && String(entry.idProjet) === String(savedEntry.idProjet)));

        return {
          ...emp,
          monthlyData: sortMonthlyData([...nextEntries, savedEntry])
        };
      })
    );
  };

  const addMonthlyData = async (data) => {
    const payload = {
      ...data,
      idEmployé: Number(data.idEmployé),
      totalFrais: data.totalFrais ?? ((Number(data.fraisRepas) || 0) + (Number(data.fraisKilometriques) || 0) + (Number(data.autresFrais) || 0)),
      totalCharges: data.totalCharges ?? ((Number(data.chargesPatronales) || 0) + (Number(data.chargesSalariales) || 0))
    };

    const res = await api.post('/donnees-mensuelles', payload);
    upsertLocalMonthlyData(res.data);
    return res.data;
  };

  const value = {
    employees,
    projects,
    monthlyData,
    loading,
    addMonthlyData,
    fetchEmployees,
    fetchProjects,
    fetchMonthlyData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

//évite de multiplier les appels API dans chaque composant. Une seule récupération au démarrage.
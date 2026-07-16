require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
const { Role, Employe, Projet, Client, Facture, DonneesMensuelles, Utilisateur } = require('./models');

/**
 * Script de peuplement ULTRA-DETAIL V6 pour Elzei Rentabilité.
 * Remplit TOUS les champs financiers avec des données logiques et variées.
 */
async function seed() {
  console.log('--- Initialisation ULTRA-DETAIL 2026 (Finances Réalistes) ---');
  try {
    // 0. Réinitialisation
    console.log('Nettoyage des données existantes...');
    await Utilisateur.destroy({ where: {} });
    await Facture.destroy({ where: {} });
    await DonneesMensuelles.destroy({ where: {} });

    // 1. Utilisateurs
    const hashedPwd = await bcrypt.hash('admin123', 10);
    await Utilisateur.create({ nomUtilisateur: 'admin', motDePasse: hashedPwd, rôle: 'admin' });
    await Utilisateur.create({ nomUtilisateur: 'iyed', motDePasse: hashedPwd, rôle: 'admin' });

    // 2. Rôles
    await Role.upsert({ id: 1, nom: 'Admin' });
    await Role.upsert({ id: 2, nom: 'Financier' });
    await Role.upsert({ id: 3, nom: 'Salarié' });

    // 3. Clients
    const clients = [
      { dolibarrId: 'CL-A', nom: 'Airbus Systems', codeClient: 'AIR-2026' },
      { dolibarrId: 'CL-B', nom: 'Thales Digital', codeClient: 'THA-2026' },
      { dolibarrId: 'CL-C', nom: 'Air France', codeClient: 'AF-2026' },
      { dolibarrId: 'CL-D', nom: 'Orange Business', codeClient: 'ORA-2026' },
      { dolibarrId: 'CL-E', nom: 'Elzei Internal', codeClient: 'INT-2026' }
    ];
    for (const c of clients) await Client.upsert(c);

    // 4. Salariés
    const employes = [
      { id: 1, nom: 'Mohamed Iyed', tjm: 1000, baseSalary: 6500 },
      { id: 2, nom: 'Sophie Bernard', tjm: 800, baseSalary: 5000 },
      { id: 3, nom: 'Lucas Petit', tjm: 600, baseSalary: 4200 },
      { id: 4, nom: 'Julie Martin', tjm: 500, baseSalary: 4800 },
      { id: 5, nom: 'Thomas Dubois', tjm: 850, baseSalary: 5500 }
    ];
    for (const e of employes) {
      await Employe.upsert({ 
        id: e.id, idEmployé: `E00${e.id}`, nom: e.nom, email: `${e.nom.split(' ')[0].toLowerCase()}@elzei.fr`, 
        idRôle: e.id === 1 ? 1 : 3, tjm: e.tjm, statut: 'Actif',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nom)}&background=random`
      });
    }

    // 5. Projets
    const projets = [
      { id: 1, titre: 'Modernisation ERP', empId: 1, cId: 'CL-A', tjm: 1000 },
      { id: 2, titre: 'Sécurisation Cyber', empId: 2, cId: 'CL-B', tjm: 800 },
      { id: 3, titre: 'Refonte Mobile', empId: 3, cId: 'CL-C', tjm: 600 },
      { id: 4, titre: 'Transformation RH', empId: 4, cId: 'CL-E', tjm: 500 },
      { id: 5, titre: 'Architecture Cloud', empId: 5, cId: 'CL-D', tjm: 850 }
    ];
    for (const p of projets) {
      await Projet.upsert({
        id: p.id, titre: p.titre, référence: `PRJ-${p.id}`, idEmployé: p.empId, 
        idDolibarrClient: p.cId, nomClient: clients.find(c => c.dolibarrId === p.cId).nom, 
        tjm: p.tjm, statut: 'En cours', marge: 30
      });
    }

    // 6. Génération Financière (12 mois x 5 salariés)
    console.log('Gération des finances détaillées...');
    for (let m = 1; m <= 12; m++) {
      const moisStr = `2026-${String(m).padStart(2, '0')}`;
      const timestamp = Math.floor(new Date(2026, m - 1, 10).getTime() / 1000);

      for (const p of projets) {
        const emp = employes.find(e => e.id === p.empId);
        
        // --- Simulation de Facturation ---
        const jours = 18 + (m % 4); // 18, 19, 20 ou 21 jours
        const montantFacturé = p.tjm * jours;

        await Facture.create({
          dolibarrId: `FAC2026-${m}-${p.id}`,
          référence: `FA26-${String(m).padStart(2, '0')}-${p.id}`,
          date: timestamp,
          total_ht: montantFacturé,
          total_ttc: montantFacturé * 1.2,
          statut: '1',
          payé: '1',
          idClient: p.cId,
          nomClient: clients.find(c => c.dolibarrId === p.cId).nom,
          lignes: [{ subprice: p.tjm, qty: jours, total_ht: montantFacturé, label: p.titre }],
          actif: true
        });

        // --- CALCULS FINANCIERS RÉALISTES ---
        const sBrut = emp.baseSalary + (m * 50); // légère augmentation mensuelle simulée
        const cSalariales = sBrut * 0.22;
        const sNetAvantPAS = sBrut - cSalariales;
        const sNetApresPAS = sNetAvantPAS * 0.91; // 9% prélèvement à la source moyen
        const cPatronales = sBrut * 0.44;
        
        const fRepas = 160 + (m * 5);
        const fKilo = 250 + (m * 10);
        const fAutres = 80 + (m * 2);
        const tFrais = fRepas + fKilo + fAutres;
        
        const tCharges = cSalariales + cPatronales;
        const sNetHorsRepas = sNetApresPAS - (fRepas * 0.5); // Simulation simplifiée
        
        const coutTotal = sBrut + cPatronales + tFrais;
        const rentabilite = montantFacturé - coutTotal;
        const pctRent = (rentabilite / montantFacturé) * 100;

        await DonneesMensuelles.create({
          idEmployé: emp.id,
          idProjet: p.id,
          mois: moisStr,
          tjm: p.tjm,
          joursTravaillés: jours,
          montantFacturé: montantFacturé,
          facturePayée: true,
          salaireBrut: sBrut,
          salaireNetAvantPAS: sNetAvantPAS,
          salaireNetApresPAS: sNetApresPAS,
          salaireNetHorsRepas: sNetHorsRepas,
          fraisRepas: fRepas,
          fraisKilometriques: fKilo,
          autresFrais: fAutres,
          chargesSalariales: cSalariales,
          chargesPatronales: cPatronales,
          totalFrais: tFrais,
          totalCharges: tCharges,
          coutTotal: coutTotal,
          rentabilite: rentabilite,
          pourcentageRentabilite: pctRent,
          totalPercu: sNetApresPAS + tFrais,
          extra: m % 3 === 0 ? 500 : 0 // Prime tous les 3 mois
        });
      }
    }

    console.log('--- Initialisation ULTRA-DETAIL terminée ! ---');
    console.log('Comptes : admin / admin123');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Erreur :', err);
    process.exit(1);
  }
}

seed();

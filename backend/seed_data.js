require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
const { Role, Employe, Projet, Client, Facture, DonneesMensuelles, Utilisateur } = require('./models');

/**
 * Script de peuplement MASSIF V5 pour Elzei Rentabilité.
 * Inclut la création d'utilisateurs pour l'authentification locale (Login).
 */
async function seed() {
  console.log('--- Nettoyage et Initialisation Propre 2026 (avec Utilisateurs) ---');
  try {
    // 0. Nettoyage des tables
    console.log('Réinitialisation des tables...');
    await Utilisateur.destroy({ where: {} });
    await Facture.destroy({ where: {} });
    await DonneesMensuelles.destroy({ where: {} });

    // 1. Utilisateurs (pour le Login)
    console.log('Création des comptes Utilisateurs...');
    const hashedPwd = await bcrypt.hash('admin123', 10);
    await Utilisateur.create({
      nomUtilisateur: 'admin',
      motDePasse: hashedPwd,
      rôle: 'admin'
    });
    await Utilisateur.create({
        nomUtilisateur: 'iyed',
        motDePasse: hashedPwd,
        rôle: 'admin'
      });

    // 2. Rôles
    await Role.upsert({ id: 1, nom: 'Admin' });
    await Role.upsert({ id: 2, nom: 'Financier' });
    await Role.upsert({ id: 3, nom: 'Salarié' });

    // 3. Clients
    console.log('Configuration Clients...');
    const clients = [
      { dolibarrId: 'CL-A', nom: 'Airbus Systems', codeClient: 'AIR-2026' },
      { dolibarrId: 'CL-B', nom: 'Thales Digital', codeClient: 'THA-2026' },
      { dolibarrId: 'CL-C', nom: 'Air France', codeClient: 'AF-2026' },
      { dolibarrId: 'CL-D', nom: 'Orange Business', codeClient: 'ORA-2026' },
      { dolibarrId: 'CL-E', nom: 'Elzei Internal', codeClient: 'INT-2026' }
    ];
    for (const c of clients) await Client.upsert(c);

    // 4. Salariés
    console.log('Configuration Salariés...');
    const employes = [
      { id: 1, idEmployé: 'E001', nom: 'Mohamed Iyed', email: 'iyed@elzei.fr', idRôle: 1, tjm: 1000, salary: 6500 },
      { id: 2, idEmployé: 'E002', nom: 'Sophie Bernard', email: 'sophie@elzei.fr', idRôle: 3, tjm: 800, salary: 5000 },
      { id: 3, idEmployé: 'E003', nom: 'Lucas Petit', email: 'lucas@elzei.fr', idRôle: 3, tjm: 600, salary: 4200 },
      { id: 4, idEmployé: 'E004', nom: 'Julie Martin', email: 'julie@elzei.fr', idRôle: 2, tjm: 500, salary: 4800 },
      { id: 5, idEmployé: 'E005', nom: 'Thomas Dubois', email: 'thomas@elzei.fr', idRôle: 3, tjm: 850, salary: 5500 }
    ];
    for (const e of employes) {
      await Employe.upsert({ 
        id: e.id, idEmployé: e.idEmployé, nom: e.nom, email: e.email, idRôle: e.idRôle, tjm: e.tjm, statut: 'Actif' 
      });
    }

    // 5. Projets
    console.log('Configuration Projets...');
    const projets = [
      { id: 1, titre: 'Modernisation ERP', ref: 'PRJ-AIR-01', empId: 1, cId: 'CL-A', cName: 'Airbus Systems', tjm: 1000 },
      { id: 2, titre: 'Sécurisation Cyber', ref: 'PRJ-THA-02', empId: 2, cId: 'CL-B', cName: 'Thales Digital', tjm: 800 },
      { id: 3, titre: 'Refonte Mobile', ref: 'PRJ-AF-03', empId: 3, cId: 'CL-C', cName: 'Air France', tjm: 600 },
      { id: 4, titre: 'Transformation RH', ref: 'PRJ-INT-04', empId: 4, cId: 'CL-E', cName: 'Elzei Internal', tjm: 500 },
      { id: 5, titre: 'Architecture Cloud', ref: 'PRJ-ORA-05', empId: 5, cId: 'CL-D', cName: 'Orange Business', tjm: 850 }
    ];
    for (const p of projets) {
      await Projet.upsert({
        id: p.id, titre: p.titre, référence: p.ref, idEmployé: p.empId, 
        idDolibarrClient: p.cId, nomClient: p.cName, tjm: p.tjm, statut: 'En cours', marge: 25
      });
    }

    // 6. Génération (12 mois 2026)
    console.log('Génération propre (1 facture/projet/mois)...');
    for (let m = 1; m <= 12; m++) {
      const moisStr = `2026-${String(m).padStart(2, '0')}`;
      const timestamp = Math.floor(new Date(2026, m - 1, 15).getTime() / 1000);

      for (const p of projets) {
        const emp = employes.find(e => e.id === p.empId);
        const days = 20; 
        const amountHt = p.tjm * days;
        
        await Facture.create({
          dolibarrId: `FAC-26-${String(m).padStart(2, '0')}-${p.id}`,
          référence: `FA26-${String(m).padStart(2, '0')}-${p.id}`,
          date: timestamp,
          total_ht: amountHt,
          total_ttc: amountHt * 1.2,
          statut: '1',
          payé: '1',
          idClient: p.cId,
          nomClient: p.cName,
          codeClient: clients.find(c => c.dolibarrId === p.cId).codeClient,
          lignes: [{ subprice: p.tjm, qty: days, total_ht: amountHt, label: p.titre }],
          actif: true
        });

        const chargesPatronales = emp.salary * 0.45;
        const totalFrais = 400;
        const coutTotal = emp.salary + chargesPatronales + totalFrais;

        await DonneesMensuelles.create({
          idEmployé: emp.id,
          idProjet: p.id,
          mois: moisStr,
          tjm: p.tjm,
          joursTravaillés: days,
          montantFacturé: amountHt,
          facturePayée: true,
          salaireBrut: emp.salary,
          salaireNetAvantPAS: emp.salary * 0.75,
          salaireNetApresPAS: emp.salary * 0.70,
          chargesPatronales: chargesPatronales,
          chargesSalariales: emp.salary * 0.22,
          totalFrais: totalFrais,
          coutTotal: coutTotal,
          rentabilite: amountHt - coutTotal,
          pourcentageRentabilite: ((amountHt - coutTotal) / amountHt) * 100
        });
      }
    }

    console.log('--- Initialisation PROPRE v5 terminée ! ---');
    console.log('IDENTIFIANTS DE TEST :');
    console.log('Utilisateur: admin / Mot de passe: admin123');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Erreur :', err);
    process.exit(1);
  }
}

seed();

require('dotenv').config();
const { Op } = require('sequelize');
const { sequelize } = require('./config/db');
const { Employe, Projet, Client, Facture, DonneesMensuelles } = require('./models');

/**
 * Script de peuplement multi-années (2024, 2025, Jan–Juin 2026).
 * - Supprime les données dont le mois > "2026-06"
 * - Ajoute des données variées pour tous les projets sur plusieurs années
 */
async function seedMultiYear() {
  console.log('=== Seed Multi-Années : démarrage ===');
  try {
    await sequelize.authenticate();
    console.log('Connexion DB OK.');

    // -----------------------------------------------------------
    // 1. Suppression des enregistrements dont le mois > "2026-06"
    // -----------------------------------------------------------
    console.log('Suppression des données postérieures à juin 2026...');

    const deletedDM = await DonneesMensuelles.destroy({
      where: { mois: { [Op.gt]: '2026-06' } }
    });
    const deletedFAC = await Facture.destroy({
      where: sequelize.literal("FROM_UNIXTIME(`date`) > '2026-06-30 23:59:59'")
    });
    console.log(`  → ${deletedDM} ligne(s) DonneesMensuelles supprimée(s)`);
    console.log(`  → ${deletedFAC} facture(s) supprimée(s)`);

    // -----------------------------------------------------------
    // 2. Récupération des projets et employés existants
    // -----------------------------------------------------------
    const projets = await Projet.findAll({ order: [['id', 'ASC']] });
    const employes = await Employe.findAll({ order: [['id', 'ASC']] });
    const clients = await Client.findAll();

    if (projets.length === 0) {
      console.error('Aucun projet trouvé. Lancez d\'abord seed_data.js.');
      process.exit(1);
    }

    console.log(`Projets trouvés : ${projets.map(p => p.titre).join(', ')}`);

    // -----------------------------------------------------------
    // 3. Helper : récupérer l'employé lié à un projet
    // -----------------------------------------------------------
    const getEmp = (proj) => employes.find(e => e.id === proj.idEmployé) || employes[0];

    // Salaires de base par employé (fallback si absent)
    const baseSalaryMap = {
      1: 6500, 2: 5000, 3: 4200, 4: 4800, 5: 5500
    };

    // -----------------------------------------------------------
    // 4. Génération des données 2024, 2025 et Jan–Juin 2026
    // -----------------------------------------------------------
    const periodesAGenerer = [
      // { annee, moisDebut, moisFin }
      { annee: 2024, moisDebut: 1, moisFin: 12 },
      { annee: 2025, moisDebut: 1, moisFin: 12 },
      { annee: 2026, moisDebut: 1, moisFin: 6 },
    ];

    // Variateurs pour diversifier les données
    const variations = [
      { facteurTJM: 1.00, joursBase: 18, tendanceSalaire:  0 },
      { facteurTJM: 1.05, joursBase: 20, tendanceSalaire: 50 },
      { facteurTJM: 0.95, joursBase: 17, tendanceSalaire: 30 },
      { facteurTJM: 1.10, joursBase: 21, tendanceSalaire: 80 },
      { facteurTJM: 0.98, joursBase: 19, tendanceSalaire: 20 },
    ];

    let totalDM = 0;
    let totalFAC = 0;

    for (const periode of periodesAGenerer) {
      const { annee, moisDebut, moisFin } = periode;

      for (let m = moisDebut; m <= moisFin; m++) {
        const moisStr = `${annee}-${String(m).padStart(2, '0')}`;
        // Timestamp au 10 du mois
        const timestamp = Math.floor(new Date(annee, m - 1, 10).getTime() / 1000);

        for (let pi = 0; pi < projets.length; pi++) {
          const proj = projets[pi];
          const emp = getEmp(proj);
          const baseSalary = baseSalaryMap[emp.id] || 5000;
          const v = variations[pi % variations.length];

          // --- Variantes annuelles (augmentation progressive) ---
          const augmentationAnnuelle = (annee - 2024) * 150; // +150€ brut par an
          const tjmEffectif = proj.tjm * v.facteurTJM;
          const jours = v.joursBase + (m % 3); // 17–23 jours selon mois
          const montantFacture = Math.round(tjmEffectif * jours);

          // --- Salaires ---
          const sBrut = baseSalary + augmentationAnnuelle + m * v.tendanceSalaire;
          const cSalariales = sBrut * 0.22;
          const sNetAvantPAS = sBrut - cSalariales;
          const tauxPAS = 0.08 + (pi * 0.005); // entre 8% et 10%
          const sNetApresPAS = sNetAvantPAS * (1 - tauxPAS);
          const cPatronales = sBrut * 0.44;

          // --- Frais ---
          const fRepas = 140 + (m * 5) + (pi * 10);
          const fKilo  = 200 + (m * 8) + (annee - 2024) * 20;
          const fAutres = 60 + (pi * 15) + (m % 4) * 10;
          const tFrais = fRepas + fKilo + fAutres;

          const tCharges = cSalariales + cPatronales;
          const sNetHorsRepas = sNetApresPAS - fRepas * 0.5;
          const coutTotal = sBrut + cPatronales + tFrais;
          const rentabilite = montantFacture - coutTotal;
          const pctRent = (rentabilite / montantFacture) * 100;
          const prime = m % 3 === 0 ? 400 + pi * 50 : 0; // prime trimestrielle variée

          const client = clients.find(c => c.dolibarrId === proj.idDolibarrClient);
          const nomClient = client ? client.nom : proj.nomClient || 'Client inconnu';

          // --- Facture ---
          const facRef = `FA${annee}-${String(m).padStart(2, '0')}-${proj.id}`;
          const [, factureCreated] = await Facture.findOrCreate({
            where: { référence: facRef },
            defaults: {
              dolibarrId: `FAC${annee}-${m}-${proj.id}`,
              référence: facRef,
              date: timestamp,
              total_ht: montantFacture,
              total_ttc: Math.round(montantFacture * 1.2),
              statut: '1',
              payé: m % 5 === 0 ? '0' : '1', // 1 mois sur 5 : impayé (variation)
              idClient: proj.idDolibarrClient,
              nomClient,
              lignes: [{ subprice: tjmEffectif, qty: jours, total_ht: montantFacture, label: proj.titre }],
              actif: true
            }
          });
          if (factureCreated) totalFAC++;

          // --- DonneesMensuelles ---
          const [, dmCreated] = await DonneesMensuelles.findOrCreate({
            where: { idEmployé: emp.id, idProjet: proj.id, mois: moisStr },
            defaults: {
              tjm: tjmEffectif,
              joursTravaillés: jours,
              montantFacturé: montantFacture,
              facturePayée: m % 5 !== 0,
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
              rentabilite: Math.round(rentabilite * 100) / 100,
              pourcentageRentabilite: Math.round(pctRent * 100) / 100,
              totalPercu: Math.round((sNetApresPAS + tFrais) * 100) / 100,
              extra: prime
            }
          });
          if (dmCreated) totalDM++;
        }
      }
      console.log(`  ✔ Année ${annee} (mois ${moisDebut}–${moisFin}) générée.`);
    }

    console.log(`\n=== Résumé ===`);
    console.log(`  Données mensuelles insérées : ${totalDM}`);
    console.log(`  Factures insérées           : ${totalFAC}`);
    console.log('=== Seed Multi-Années terminé ! ===');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seed :', err);
    process.exit(1);
  }
}

seedMultiYear();

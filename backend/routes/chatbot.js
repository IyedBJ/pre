const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const multer = require("multer");
const fs = require("fs");  // Pour manipuler les fichiers téléchargés (suppression après transcription)
const path = require("path");
const { Projet, Employe, DonneesMensuelles, Configuration, Client } = require("../models");



// Configuration de Multer pour le stockage temporaire des fichiers audio envoyés par le frontend
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const SYSTEM_PROMPT = `Tu es un assistant IA intégré dans l'application de gestion de rentabilité d'Elzei, une entreprise de services informatiques (ESN).

Contexte de l'application :
- L'application s'appelle "Elzei Rentabilité" et est développée par Mohamed iyed ben jazia.
- Elle permet au management d'Elzei de suivre la rentabilité des projets, des salariés et des clients.

Modules fonctionnels :
1. Tableau de bord : Vue globale des indicateurs de performance (KPIs), marge brute, chiffre d'affaires.
2. Gestion des Salariés : Saisie de données salariales mensuelles (salaire net, frais repas, frais kilométriques, primes).
3. Gestion des Projets : Suivi de l'état, du budget, des délais et de la rentabilité de chaque projet (depuis Dolibarr).
4. Gestion des Clients : Visualisation des clients importés depuis Dolibarr ERP.
5. Facturation : Suivi des factures émises et de leur état de paiement.
6. Historique : Consultation de l'historique de toutes les saisies mensuelles.
7. Intelligence Prédictive (Prévision IA) : Analyses stratégiques, projections financières à 6 mois.
8. Paramètres : Gestion des rôles utilisateurs.

Stack technique : React.js, Node.js/Express, MySQL/Sequelize, Dolibarr ERP, Active Directory LDAP, JWT.

Formules et définitions clés :
- **Rentabilité** = Montant Facturé - Total Perçu (Net Avant Impôt + Frais).
- **Total Perçu** (Coût du salarié) = Salaire Net Avant Impôt + Frais Kilométriques + Autres Frais.
- **Marge %** = (Rentabilité / Montant Facturé) * 100.
- **Facturations** (ou Chiffre d'Affaires) = Somme des montants facturés (Montant Facturé = TJM * Jours travaillés).
- **Salariés** = Collaborateurs d'Elzei affectés aux projets.

À propos d'Elzei : Société de conseil et d'ingénierie informatique qui gère des projets pour divers clients avec des équipes d'ingénieurs et de consultants.

Instructions importantes :
- Sois extrêmement CONCIS, précis et professionnel. 
- Utilise UNIQUEMENT les données fournies dans le "DONNÉES ACTUELLES DE L'APPLICATION" pour répondre aux questions sur les chiffres, les noms de projets ou les clients.
- Ne JAMAIS inventer de données, de noms de projets ou de chiffres si la donnée ne figure pas dans le contexte.
- Support et Tarifs : Si l'utilisateur demande comment contacter le support, ou demande des informations sur les tarifs, réponds toujours poliment et redirige-le vers le site web officiel : https://elzei.fr/. Ne réponds pas "je ne dispose pas de ces informations", donne plutôt le lien du site.
- Réponds en MAXIMUM 3-4 phrases courtes. Ne développe que si l'utilisateur le demande explicitement.
- Évite les introductions inutiles. Va droit au but.
- Utilise des listes markdown quand c'est utile.
- Tu es spécialisé sur ce projet et cette société uniquement.`;

/**
 * Route POST /
 * Point d'entrée principal du Chatbot. Reçoit un message et l'historique de la conversation,
 * puis appelle l'API Groq avec un contexte enrichi des données de l'application.
 */
router.post("/", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message requis." });
  }

  try {
    let apiKey = process.env.GROQ_API_KEY;
    
    // Essayer de récupérer la clé depuis la base de données
    try {
      const config = await Configuration.findOne({ where: { key: 'GROQ_API_KEY' } });
      if (config && config.value) {
        apiKey = config.value;
      }
    } catch (err) {
      console.error("Erreur récupération clé API de la DB:", err);
    }

    if (!apiKey || apiKey === "undefined" || !apiKey.trim()) {
      return res.status(500).json({ error: "Clé API Groq manquante" });
    }

    const groq = new Groq({ apiKey });

    //Récupération des données de l’application

    let dataContext = "\n\nDONNÉES ACTUELLES DE L'APPLICATION :\n";
    try {
      const [projects, allMonthlyData, employeeCount, clientCount] = await Promise.all([
        Projet.findAll({
          include: [{ model: Employe, as: 'employe', attributes: ['nom'] }]
        }),
        DonneesMensuelles.findAll(),
        Employe.count(),
        Client.count()
      ]);
      
      const totalRevenue = allMonthlyData.reduce((acc, d) => acc + (d.montantFacturé || 0), 0);
      const totalMargin = allMonthlyData.reduce((acc, d) => acc + (d.rentabilite || 0), 0);

      dataContext += `SYSTÈME : ${employeeCount} salariés travaillent actuellement sur ${projects.length} projets pour ${clientCount} clients au total.\n`;
      dataContext += `FINANCES GLOBALES : Chiffre d'Affaires Total (Facturations) = ${totalRevenue.toLocaleString()}€, Rentabilité Totale = ${totalMargin.toLocaleString()}€.\n\n`;

      dataContext += `RÉSUMÉ DES PROJETS (${projects.length} au total) :\n`;
      const projectsSorted = [...projects].sort((a,b) => (b.marge || 0) - (a.marge || 0));
      
      // If many projects, list top 15, otherwise list all
      const projectsToShow = projectsSorted.slice(0, 15);
      projectsToShow.forEach(p => {
        dataContext += `- ${p.titre} (${p.nomClient || 'Client inconnu'}) : Statut=${p.statut}, Marge=${p.marge}%, Responsable=${p.employe ? p.employe.nom : 'N/A'}\n`;
      });

      if (projects.length > 15) {
        dataContext += `... et ${projects.length - 15} autres projets.\n`;
      }

      dataContext += "\nFOCUS TOP 3 :\n";
      const top3 = projectsSorted.slice(0, 3);
      top3.forEach(p => {
        dataContext += `- ${p.titre} : ${p.marge}%\n`;
      });

      const recentData = await DonneesMensuelles.findAll({
        limit: 5,
        order: [['mois', 'DESC']],
        include: [{ model: Employe, as: 'employe', attributes: ['nom'] }, { model: Projet, as: 'project', attributes: ['titre'] }]
      });

      if (recentData.length > 0) {
        dataContext += "\nDERNIÈRES PERFORMANCES MENSUELLES :\n";
        recentData.forEach(d => {
          dataContext += `- ${d.mois} | ${d.employe ? d.employe.nom : 'N/A'} sur ${d.project ? d.project.titre : 'Divers'} : Rentabilité=${d.rentabilite}€\n`;
        });
      }
    } catch (err) {
      console.error("Erreur lors de l'enrichissement du contexte IA:", err);
      dataContext += "\n(Données en temps réel indisponibles)";
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + dataContext },
      ...(history || []).map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.text,
      })),
      { role: "user", content: message },
    ];

    let model = "llama-3.3-70b-versatile";
    try {
      const modelConfig = await Configuration.findOne({ where: { key: 'GROQ_MODEL' } });
      if (modelConfig && modelConfig.value) {
        model = modelConfig.value;
      }
    } catch (err) {
      console.error("Erreur récupération modèle de la DB:", err);
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: model,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const response = chatCompletion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

    res.json({ reply: response });
  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ error: `Erreur IA (Groq) : ${error.message}` });
  }
});

/**
 * Route POST /transcribe
 * Reçoit un fichier audio (WebM/WAV), l'envoie à l'API Whisper de Groq pour transcription,
 * et renvoie le texte reconnu au frontend.
 */
router.post("/transcribe", upload.single("file"), async (req, res) => {
  if (!req.file) {
    console.error("Transcription: Aucun fichier reçu.");
    return res.status(400).json({ error: "Fichier audio manquant." });
  }

  // Check file size (sometimes browser sends almost empty chunks)
  if (req.file.size < 100) {
    console.warn("Transcription: Fichier trop petit (", req.file.size, "bytes).");
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Audio trop court ou vide. Parlez un peu plus longtemps." });
  }

  console.log("Transcription: Fichier reçu:", req.file.path, "Size:", req.file.size);

  try {
    let apiKey = process.env.GROQ_API_KEY;
    
    // Essayer de récupérer la clé depuis la base de données
    try {
      const config = await Configuration.findOne({ where: { key: 'GROQ_API_KEY' } });
      if (config && config.value) {
        apiKey = config.value;
      }
    } catch (err) {
      console.error("Erreur récupération clé API de la DB (transcription):", err);
    }
    if (!apiKey) throw new Error("GROQ_API_KEY non configurée.");

    const groq = new Groq({ apiKey });

    // Whisper v3 via Groq
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3",
      response_format: "json",
    });

    console.log("Transcription: Succès pour", req.file.path, "Texte reconu:", transcription.text);

    // Nettoyage
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcription Error (Detailed):", error);
    
    // Nettoyage en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Return more details to frontend
    const errorMessage = error.response?.data?.error?.message || error.message;
    res.status(500).json({ 
      error: `Erreur de transcription : ${errorMessage}`,
      code: error.status || 500
    });
  }
});

module.exports = router;

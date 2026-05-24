const express = require('express');
const router = express.Router();
const getDolibarrApi = require('../config/axiosConfig');
const { Client } = require('../models');

/**
 * GET /api/clients
 * Récupère tous les clients depuis la base de données locale.
 * Transforme chaque objet client pour qu'il expose :
 * - un champ 'id' égal à 'dolibarrId' (compatible avec le front)
 * - un champ 'avatar' (URL du logo si présent)
 */
router.get('/', async (req, res) => {
  try {
    // Récupération de tous les clients, triés par nom alphabétique
    const clients = await Client.findAll({
      order: [['nom', 'ASC']]
    });

    // Transformation des données pour le frontend
    const mappedClients = clients.map(c => {
      // Convertit l'instance Sequelize en objet JS simple
      const plain = c.get({ plain: true });
      return {
        ...plain,                                // tous les champs d'origine
        id: plain.dolibarrId,                    // renomme dolibarrId -> id
        avatar: plain.logo 
          ? `/api/clients/logo/${plain.dolibarrId}/${plain.logo}` // URL du proxy logo
          : null
      };
    });

    // Réponse JSON
    res.json(mappedClients);
  } catch (err) {
    console.error(`Database Error Clients:`, err.message);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des clients depuis la base locale",
      error: err.message
    });
  }
});

/**
 * GET /api/clients/logo/:id/:filename
 * Proxy pour récupérer un logo stocké dans Dolibarr.
 * Dolibarr expose ses documents via une API qui renvoie du base64.
 * Ce middleware convertit le base64 en fichier binaire et l'envoie avec le bon Content-Type.
 */
router.get('/logo/:id/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;

    // Chemin attendu par Dolibarr pour les logos de sociétés : {dolibarrId}/logos/{nom_fichier}
    const filePath = `${id}/logos/${filename}`;

    // Instance Axios configurée pour Dolibarr (authentification, baseURL)
    const dolibarrApi = await getDolibarrApi();

    console.log(`[LogoProxy] Requesting: ${filePath}`);

    // Appel à l'API Dolibarr : endpoint /documents/download
    const response = await dolibarrApi.get('/documents/download', {
      params: {
        modulepart: 'societe',   // contexte "société"
        original_file: filePath
      },
      timeout: 15000  // 15 secondes max
    });

    // Vérifie que la réponse contient bien une propriété 'content' en base64
    if (response.data && response.data.content) {
      console.log(`[LogoProxy] Success: Received base64 for ${filename}`);
      
      // Conversion base64 -> buffer binaire
      const buffer = Buffer.from(response.data.content, 'base64');
      
      // Détermination du type MIME (Dolibarr peut le fournir, sinon défaut PNG)
      const contentType = response.data['content-type'] || 'image/png';
      
      // En-têtes de la réponse
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
      
      // Envoi du fichier binaire
      res.send(buffer);
    } else {
      // Format de réponse inattendu (pas de 'content')
      console.warn(`[LogoProxy] Unexpected response format for ${filename}`, Object.keys(response.data));
      res.status(404).send('Logo content missing');
    }
  } catch (err) {
    // Extraction du code HTTP et du message d'erreur (depuis Dolibarr ou local)
    const status = err.response?.status || 404;
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`[LogoProxy] Error ${status} for ${req.params.filename}:`, msg);
    res.status(status).send(`Logo error: ${msg}`);
  }
});

module.exports = router;
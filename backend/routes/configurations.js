const express = require('express');
const router = express.Router();
const { Configuration } = require('../models');

/**
 * Route GET /:key
 * Récupère une valeur de configuration par sa clé unique.
 * Si la clé est "GROQ_API_KEY", la valeur est partiellement masquée pour la sécurité.
 */
router.get('/:key', async (req, res) => {
  try {
    const config = await Configuration.findOne({ where: { key: req.params.key } });
    if (!config) return res.json({ value: null });
    
    let value = config.value;
    // On masque la clé si c'est la clé Groq
    if (req.params.key === 'GROQ_API_KEY' && value && value.length > 8) {
      value = value.substring(0, 4) + '****************' + value.substring(value.length - 4);
    }
    //{ "value": "sk-****************abc4" }
    
    res.json({ value });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Route POST /
 * Crée une nouvelle configuration ou met à jour une existante.
 * Reçoit { key, value, description } dans le corps de la requête.
 */
router.post('/', async (req, res) => {
  const { key, value, description } = req.body;
  try {
    let config = await Configuration.findOne({ where: { key } });
    //On cherche si une ligne avec cette key existe déjà. Si oui, on met à jour la valeur et la description. Sinon, on en crée une nouvelle.
    if (config) {
      await config.update({ value, description });
    } else {
      config = await Configuration.create({ key, value, description });
    }
    res.json({ message: 'Configuration enregistrée' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

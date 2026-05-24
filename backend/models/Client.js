const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Client = sequelize.define('Client', {
  dolibarrId: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  source_instance: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'default_erp'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false   //obligatoire
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  codeClient: {
    type: DataTypes.STRING,
    allowNull: true
  },
  projets: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ca: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  latent: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('Payé', 'En attente', 'En retard'),
    defaultValue: 'En attente'
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  codePostal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'téléphone'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'siteWeb'
  },
  country_code: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'codePays'
  },
  capital: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  siren: {
    type: DataTypes.STRING,
    allowNull: true
  },
  siret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ape: {
    type: DataTypes.STRING,
    allowNull: true
  },
  note_public: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notePublique'
  },
  /*
  tva_intra: {
    type: DataTypes.STRING,
    allowNull: true
  },
  */
  totalCaHt: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  totalCaTtc: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  montantRestant: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  nombreFactures: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  réfDernièreFacture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateDernièreFacture: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dernièreSync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  bg: {
    type: DataTypes.STRING,
    defaultValue: "bg-blue-100"
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['dolibarrId', 'source_instance'],
      name: 'client_dolibarr_instance_unique'
    }
  ]
});

module.exports = Client;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Facture = sequelize.define('Facture', {
  dolibarrId: {
    type: DataTypes.STRING(191),
    allowNull: false
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
  référence: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.INTEGER, // Store as timestamp seconds
    allowNull: true
  },
  dateEchéance: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  total_ht: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  total_ttc: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  total_tva: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payé: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resteAPayer: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  idClient: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nomClient: {
    type: DataTypes.STRING,
    allowNull: true
  },
  codeClient: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lignes: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'factures',
  indexes: [
    {
      unique: true,
      fields: ['dolibarrId', 'source_instance'],
      name: 'facture_dolibarr_instance_unique'
    }
  ]
});

module.exports = Facture;

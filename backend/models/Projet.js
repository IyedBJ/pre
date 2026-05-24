const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Projet = sequelize.define('Projet', {
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  référence: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idEmployé: {
    type: DataTypes.INTEGER, // Sequelize uses Integer for IDs by default (Auto-increment)
    allowNull: true,
    references: {
      model: 'employes',
      key: 'id'
    }
  },
  idDolibarrClient: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nomClient: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tjm: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('En cours', 'Terminé', 'En pause', 'Annulé'),
    defaultValue: 'En cours'
  },
  marge: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  remarque: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'projets'
});

module.exports = Projet;

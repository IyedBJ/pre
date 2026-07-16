const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Employe = sequelize.define('Employe', {
  idEmployé: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: 'idEmployé_unique'
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rôle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idRôle: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  numSécu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tjm: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.STRING,
    defaultValue: "Neutre"
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'employes'
});

module.exports = Employe;


// 191 = floor(767 / 4) = longueur maximale sûre pour une colonne VARCHAR avec index (unique ou simple) sous MySQL/InnoDB avec utf8mb4.


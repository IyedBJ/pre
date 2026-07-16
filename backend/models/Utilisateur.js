const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Utilisateur = sequelize.define('Utilisateur', {
  nomUtilisateur: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true
  },
  motDePasse: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rôle: {
    type: DataTypes.ENUM('admin', 'finance', 'financier', 'user'),
    defaultValue: 'user'
  }
}, {
  tableName: 'utilisateurs',
  timestamps: true
});

module.exports = Utilisateur;

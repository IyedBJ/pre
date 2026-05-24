const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Configuration = sequelize.define('Configuration', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'configurations',
  timestamps: true
});

module.exports = Configuration;

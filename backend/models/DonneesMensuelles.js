const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DonneesMensuelles = sequelize.define(
  'DonneesMensuelles',
  {
    idEmployé: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mois: {
      type: DataTypes.STRING(7),
      allowNull: false,
      validate: {
        is: /^\d{4}-\d{2}$/
      }
    },
    tjm: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    joursTravaillés: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    montantFacturé: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    facturePayée: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // ... (rest are already French or common)
    salaireBrut: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    salaireNetApresPAS: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    salaireNetAvantPAS: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    salaireNetHorsRepas: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    fraisRepas: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    fraisKilometriques: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    autresFrais: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    chargesPatronales: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    chargesSalariales: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalPercu: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalFrais: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalCharges: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    coutTotal: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    rentabilite: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    pourcentageRentabilite: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    extra: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    idProjet: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projets',
        key: 'id'
      }
    }
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['idEmployé', 'idProjet', 'mois']
      }
    ],
    tableName: 'donnees_mensuelles'
  }
);

module.exports = DonneesMensuelles;

const Utilisateur = require('./Utilisateur');
const Employe = require('./Employe');
const Projet = require('./Projet');
const Client = require('./Client');
const Role = require('./Role');
const DonneesMensuelles = require('./DonneesMensuelles');
const Facture = require('./Facture');
const Configuration = require('./Configuration');

Projet.belongsTo(Employe, { foreignKey: 'idEmployé', as: 'employe' });
Employe.hasMany(Projet, { foreignKey: 'idEmployé', as: 'projets', onDelete: 'CASCADE', hooks: true });
Role.hasMany(Employe, { foreignKey: 'idRôle', as: 'employes' });
Employe.belongsTo(Role, { foreignKey: 'idRôle', as: 'donneesRole' });

DonneesMensuelles.belongsTo(Employe, { foreignKey: 'idEmployé', as: 'employe' });
DonneesMensuelles.belongsTo(Projet, { foreignKey: 'idProjet', as: 'project' });
Employe.hasMany(DonneesMensuelles, { foreignKey: 'idEmployé', as: 'statistiquesMensuelles', onDelete: 'CASCADE', hooks: true });

Facture.belongsTo(Client, { targetKey: 'dolibarrId', foreignKey: 'idClient', as: 'client', constraints: false });
Client.hasMany(Facture, { sourceKey: 'dolibarrId', foreignKey: 'idClient', as: 'factures', constraints: false });

module.exports = {
  Utilisateur,
  Employe,
  Projet,
  Client,
  Role,
  DonneesMensuelles,
  Facture,
  Configuration
};

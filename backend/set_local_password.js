const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./config/db');
const Utilisateur = require('./models/Utilisateur');

const username = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || 'admin';

if (!username || !password) {
  console.log('Usage: node set_local_password.js <username> <password> [role]');
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion MySQL établie.');

    await sequelize.sync();

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user, created] = await Utilisateur.upsert({
      nomUtilisateur: username,
      motDePasse: hashedPassword,
      rôle: role
    });

    console.log(created ? 'Utilisateur créé.' : 'Utilisateur mis à jour.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur :', err);
    process.exit(1);
  }
})();
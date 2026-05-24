require('dotenv').config();
const { sequelize } = require('./config/db');
require('./models'); // Load models and associations

async function sync() {
  console.log('Synchronizing Aiven MySQL database schema...');
  try {
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized successfully!');
    
    // List tables to confirm
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('Tables created:', results);
    
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Synchronization failed:');
    console.error(err);
    process.exit(1);
  }
}

sync();

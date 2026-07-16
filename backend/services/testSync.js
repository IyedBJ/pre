const api = require('../config/axiosConfig');

const testDolibarr = async () => {
    try {
        const response = await api.get('/status'); 
        console.log("Connexion Dolibarr OK ! Données reçues :", response.data);
    } catch (error) {
        console.error("Échec Connexion Dolibarr :", error.response?.data || error.message);
    }
};

testDolibarr();

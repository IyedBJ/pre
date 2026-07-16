const express = require("express");
const router = express.Router();
const { loginAD } = require("../controllers/authController");

/**
 * Route POST /login
 * Gère l'authentification des utilisateurs via Active Directory (LDAP).
 */
router.post("/login", loginAD);

module.exports = router;

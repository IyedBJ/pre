// Importation des dépendances
const ldap = require("ldapjs");            // Client LDAP pour Active Directory
const jwt = require("jsonwebtoken");       // Génération de tokens JWT
const bcrypt = require("bcryptjs");        // Comparaison de mots de passe hachés (fallback)
const { Utilisateur } = require("../models"); // Modèle Sequelize des utilisateurs

// Configuration depuis les variables d'environnement
const LDAP_URL = process.env.LDAP_URL || "ldap://192.168.1.29:389";
const DOMAIN = process.env.LDAP_DOMAIN || "ELZEI";
const SEARCH_BASE = process.env.LDAP_SEARCH_BASE || "DC=elzei,DC=local";

/**
 * Contrôleur d'authentification : tente d'abord AD, puis bascule sur base locale si configuré.
 */
exports.loginAD = async (req, res) => {
  const { username, password } = req.body;

  // Vérification des champs obligatoires
  if (!username || !password) {
    return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis" });
  }

  // Normalisation du nom d'utilisateur pour le bind LDAP
  let adUser = username;
  if (!username.includes("@") && !username.includes("\\")) {
    adUser = `${DOMAIN}\\${username}`;   // Ex: ELZEI\john.doe
  }

  /**
   * Authentification locale de secours (fallback)
   * @param {string} msg - Message de contexte (pour log)
   */
  const loginLocal = async (msg) => {
    try {
      // Nettoie le nom d'utilisateur (enlève le domaine s'il a été passé)
      const cleanUsername = username.includes("\\") ? username.split("\\").pop() : username;

      // Recherche de l'utilisateur dans la base de données locale
      const user = await Utilisateur.findOne({ where: { nomUtilisateur: cleanUsername } });

      if (!user || !user.motDePasse) {
        return res.status(401).json({ 
          message: "Authentification locale impossible (Utilisateur non trouvé)" 
        });
      }

      // Vérification du mot de passe avec bcrypt
      const isMatch = await bcrypt.compare(password, user.motDePasse);
      if (!isMatch) {
        return res.status(401).json({ message: "Identifiants invalides (Local)" });
      }

      // Génération du token JWT
      const token = jwt.sign(
        { id: user.id, nomUtilisateur: user.nomUtilisateur, rôle: user.rôle || "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Réponse succès
      return res.status(200).json({
        message: "Connexion réussie (Local)",
        token,
        user: { nomUtilisateur: user.nomUtilisateur, rôle: user.rôle || "user" }
      });
    } catch (err) {
      console.error("Erreur Auth Locale:", err);
      return res.status(500).json({ message: "Erreur serveur lors de l'authentification locale" });
    }
  };

  // Tentative d'authentification LDAP
  const client = ldap.createClient({ 
    url: LDAP_URL,
    connectTimeout: 3000,   // 3 secondes pour établir la connexion
    timeout: 5000           // 5 secondes pour une opération
  });

  // Gestion des erreurs au niveau du client LDAP
  client.on("error", (err) => {
    console.error("LDAP Client Error:", err.message);
  });

  // Tentative de bind (authentification) sur l'AD
  client.bind(adUser, password, async (err) => {
    if (err) {
      console.error("Erreur Login AD:", err.message);
      try { client.unbind(); } catch(e) {} // Fermeture propre

      // Déterminer si l'erreur est réseau (serveur injoignable)
      const isNetworkError = err.message.includes("ECONNREFUSED") || 
                            err.message.includes("ETIMEDOUT") || 
                            err.message.includes("timeout");
      
      // Si fallback activé et erreur réseau → tentative locale
      if (isNetworkError && process.env.LDAP_FALLBACK === "true") {
        console.warn("AD injoignable, bascule sur l'authentification locale...");
        return loginLocal("Serveur AD injoignable");
      }

      // Sinon, erreur d'authentification AD (mauvais mot de passe ou timeout sans fallback)
      const errorMsg = isNetworkError ? `Serveur AD injoignable (Timeout: ${LDAP_URL})` : `Identifiants AD invalides: ${err.message}`;
      return res.status(401).json({ message: errorMsg });
    }

    console.log("Login AD réussi pour:", adUser);

    // Nettoyage du nom d'utilisateur pour la recherche LDAP
    const cleanUsername = username.includes("\\")
      ? username.split("\\").pop()
      : username;

    // Filtre de recherche : trouver l'utilisateur par son sAMAccountName
    const searchFilter = `(sAMAccountName=${cleanUsername})`;
    const searchOptions = {
      filter: searchFilter,
      scope: "sub",
      attributes: ["memberOf"]   // On ne demande que l'attribut memberOf
    };

    // Recherche des groupes AD de l'utilisateur
    client.search(SEARCH_BASE, searchOptions, (searchErr, searchRes) => {
      if (searchErr) {
        console.error("Erreur Recherche AD:", searchErr);
        client.unbind();
        return res.status(500).json({ message: "Erreur lors de la récupération des groupes AD" });
      }

      let memberOf = [];

      // Chaque entrée trouvée (normalement une seule)
      searchRes.on("searchEntry", (entry) => {
        const attributes = entry.pojo.attributes;
        const memberOfAttr = attributes.find(attr => attr.type === "memberOf");
        if (memberOfAttr) {
          memberOf = memberOfAttr.values;   // Liste des DN des groupes
        }
      });

      searchRes.on("error", (err) => {
        console.error("Erreur Flux Recherche AD:", err.message);
        client.unbind();
        res.status(500).json({ message: "Erreur serveur AD" });
      });

      searchRes.on("end", async (result) => {
        // Détermination du rôle à partir des groupes AD
        let role = "user";
        const isMemberOf = (groupName) => memberOf.some(group => group.includes(groupName));

        if (isMemberOf("ADMIN_TEAM")) {
          role = "admin";
        } else if (isMemberOf("FINANCE_TEAM")) {
          role = "finance";
        }
        // sinon "user" par défaut

        try {
          // Synchronisation avec la base de données locale
          let user = await Utilisateur.findOne({ where: { nomUtilisateur: cleanUsername } });

          if (!user) {
            console.log("Nouvel utilisateur AD détecté, création en base");
            user = await Utilisateur.create({
              nomUtilisateur: cleanUsername,
              rôle: role
              // Pas de mot de passe stocké pour les comptes AD
            });
          } else {
            // Mise à jour du rôle si nécessaire
            user.rôle = role;
            await user.save();
          }

          // Génération du token JWT
          const token = jwt.sign(
            { 
              id: user.id,
              nomUtilisateur: user.nomUtilisateur,
              rôle: role 
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          client.unbind(); // Fermeture de la connexion LDAP

          // Réponse succès
          res.status(200).json({
            message: "Connexion réussie",
            token,
            user: {
              nomUtilisateur: user.nomUtilisateur,
              rôle: role
            }
          });

        } catch (dbError) {
          console.error("Erreur SQL:", dbError);
          client.unbind();
          res.status(500).json({ message: "Erreur serveur" });
        }
      });
    });
  });
};
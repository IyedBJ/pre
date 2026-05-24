const ldap = require("ldapjs");

const LDAP_URL = "ldap://192.168.1.242:389"; 
const USER_UPN = "iyedtest@elzei.local";
const USER_SAM = "ELZEI\\iyedtest";
const PASSWORD = "Iyed@2026";



function testLogin(user, password, description) {
  const client = ldap.createClient({ url: LDAP_URL });

  client.bind(user, password, (err) => {
    if (err) {
      console.log(`Échec LOGIN AD (${description})`);
      console.log(err.message);
    } else {
      console.log(`LOGIN AD REUSSI (${description}) `);
    }
    client.unbind();
  });
}


console.log("Test avec UPN...");
testLogin(USER_UPN, PASSWORD, "UPN");

setTimeout(() => {
  console.log("Test avec sAMAccountName...");
  testLogin(USER_SAM, PASSWORD, "sAMAccountName");
}, 2000); 

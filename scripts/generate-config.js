const fs = require("fs");

const config = `
export const firebaseConfig = {
  apiKey: "${process.env.FIREBASE_API_KEY}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.FIREBASE_PROJECT_ID}"
};
`;

fs.writeFileSync("firebase-config.js", config);
console.log("firebase-config.js generated");
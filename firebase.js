const admin = require("firebase-admin");

// Parsing Firebase credentials from the environment variable (Base64 encoded)
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://floodwatch-cabc5-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.firestore();
const messaging = admin.messaging();

module.exports = { db, messaging };

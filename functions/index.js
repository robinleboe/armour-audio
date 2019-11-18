const functions = require("firebase-functions");

// Note: the FIREBASE_CONFIG environment variable is included automatically
// in Cloud Functions for Firebase functions that were deployed via the Firebase CLI.
const app = require("express")();

const FBAuth = require('./util/fbAuth');

const { getAllNotes, postOneNote } = require('./handlers/notes');
const { signup, login, uploadImage } = require('./handlers/users');

// note routes
app.get("/notes", getAllNotes);
app.post("/note", FBAuth, postOneNote);

// user routes
app.post("/signup", signup);
app.post("/login", login);
app.post('/user/image', FBAuth, uploadImage)

// export app so access is via Express endpoint e.g. //note to create etc.
exports.api = functions.https.onRequest(app);

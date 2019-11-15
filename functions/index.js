const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Note: the FIREBASE_CONFIG environment variable is included automatically
// in Cloud Functions for Firebase functions that were deployed via the Firebase CLI.
admin.initializeApp();

const express = require('express');
const app = express();

app.get('/notes', (req, res) => {
    admin
    .firestore()
    .collection("notes")
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let notes = [];
      data.forEach(doc => {
        notes.push({
            noteId: doc.id,
            ...doc.data()
        });
      });
      return res.json(notes);
    })
    .catch(err => console.error(err));
});

app.post('/note', (req, res) => {
  const newNote = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  admin
    .firestore()
    .collection("notes")
    .add(newNote)
    .then(doc => {
      res.json({ message: `document ${doc.id} created succesfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

exports.api = functions.https.onRequest(app);
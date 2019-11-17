const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Note: the FIREBASE_CONFIG environment variable is included automatically
// in Cloud Functions for Firebase functions that were deployed via the Firebase CLI.
const app = require("express")();
admin.initializeApp();

const firebaseConfig = {
  apiKey: "AIzaSyC_ZH_EcROJ9OS0RD_6V2uvZhxhLtM5fMQ",
  authDomain: "armour-audio.firebaseapp.com",
  databaseURL: "https://armour-audio.firebaseio.com",
  projectId: "armour-audio",
  storageBucket: "armour-audio.appspot.com",
  messagingSenderId: "743206802519",
  appId: "1:743206802519:web:48fac75fd9c6585c837f12",
  measurementId: "G-S24RKPD251"
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get("/notes", (req, res) => {
  db.collection("notes")
    .orderBy("createdAt", "desc")
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

// Post one note
app.post("/note", (req, res) => {
  if(req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Body must not be empty' });
  }
  const newNote = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db.collection("notes")
    .add(newNote)
    .then(doc => {
      res.json({ message: `document ${doc.id} created succesfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

const isEmail = email => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

// signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) errors.password = "Must not be empty";
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match";
  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  // TODO: validate data
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use " });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};

  if (isEmpty(user.email)) errors.email = "Must not be empty";
  if (isEmpty(user.password)) errors.password = "Must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if(err.code === 'auth/wrong-password') {
        return res.status(403).json({ general: 'Wrong credentials please try again'});
      } else if(err.code === 'auth/invalid-email') {
        return res.status(403).json({ general: 'Invalid email please try again'});
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

// export app so access is via Express endpoint e.g. //note to create etc.
exports.api = functions.https.onRequest(app);

const functions = require('firebase-functions');

// Note: the FIREBASE_CONFIG environment variable is included automatically
// in Cloud Functions for Firebase functions that were deployed via the Firebase CLI.
const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { db } = require('./util/admin');

const {
  getAllNotes,
  postOneNote,
  getNote,
  deleteNote,
  commentOnNote,
  likeNote,
  unlikeNote
} = require('./handlers/notes');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require('./handlers/users');

// note routes
app.get('/notes', getAllNotes);
app.post('/note', FBAuth, postOneNote);
app.get('/note/:noteId', getNote);
app.delete('/note/:noteId', FBAuth, deleteNote);
app.get('/note/:noteId/like', FBAuth, likeNote);
app.get('/note/:noteId/unlike', FBAuth, unlikeNote);
app.post('/note/:noteId/comment', FBAuth, commentOnNote);

// user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

// export app so access is via Express endpoint e.g. //note to create etc.
exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document('likes/{id}')
  .onCreate(snapshot => {
    return db
      .doc(`/notes/${snapshot.data().noteId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            noteId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnLike = functions.firestore
  .document('likes/{id}')
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document('comments/{id}')
  .onCreate(snapshot => {
    return db
      .doc(`/notes/${snapshot.data().noteId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            noteId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions.firestore
  .document(`/users/{userId}`)
  .onUpdate(change => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection('notes')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const note = db.doc(`/notes/${doc.id}`);
            batch.update(note, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onNoteDelete = functions.firestore
  .document(`/notes/{noteId}`)
  .onDelete((snapshot, context) => {
    const noteId = context.params.noteId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('noteId', '==', noteId)
      .get()
      .then(data => {
          data.forEach(doc => {
              batch.delete(db.doc(`/comments/${doc.id}`));
          })
          return db.collection('likes').where('noteId', '==', noteId).get();
      })
      .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/likes/${doc.id}`));
        })
        return db.collection('notifications').where('noteId', '==', noteId).get();
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/notifications/${doc.id}`));
        })
        return batch.commit();
    })
    .catch(err => console.error(err));
  });

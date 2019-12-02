const { db } = require('../util/admin');

exports.getAllNotes = (req, res) => {
  // access Firestore 'notes' collection
  db.collection('notes')
    .orderBy('createdAt', 'desc')
    .get()
    // receive 'data' of type FirebaseFirestore.QuerySnapshot
    .then(data => {
      // create an empty array to store retrieved notes
      let notes = [];

      // iterate through retieved docs
      data.forEach(doc => {
        // add docs to array as objects
        notes.push({
          // add the Firestore generated 'doc.id' to object
          noteId: doc.id,
          // add existing props to using the spread operator
          // on object returned by .data() 
          ...doc.data()
        });
      });
      // return an array of objects to the client
      return res.json(notes);
    })
    .catch(err => {
      // log error and return 500 internal server error to client
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postOneNote = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Body must not be empty' });
  }

  const newNote = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection('notes')
    .add(newNote)
    .then(doc => {
      const resNote = newNote;
      resNote.noteId = doc.id;
      res.json(resNote);
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
};

exports.getNote = (req, res) => {
  let noteData = {};
  db.doc(`/notes/${req.params.noteId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'note not found' });
      }
      noteData = doc.data();
      noteData.noteId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('noteId', '==', req.params.noteId)
        .get();
    })
    .then(data => {
      noteData.comments = [];
      data.forEach(doc => {
        noteData.comments.push(doc.data());
      });
      return res.json(noteData);
    })
    .catch(err => {
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};
// Comment on a note
exports.commentOnNote = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ comment: 'Must not be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    noteId: req.params.noteId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };

  db.doc(`/notes/${req.params.noteId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Note not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(err => {
      res.status(500).json({ error: 'Something went wrong' });
      console.error(err);
    });
};

exports.likeNote = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('noteId', '==', req.params.noteId)
    .limit(1);

  const noteDocument = db.doc(`/notes/${req.params.noteId}`);

  let noteData;

  noteDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        noteData = doc.data();
        noteData.noteId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Note not found' });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            noteId: req.params.noteId,
            userHandle: req.user.handle
          })
          .then(() => {
            noteData.likeCount++;
            return noteDocument.update({ likeCount: noteData.likeCount });
          })
          .then(() => {
            return res.json(noteData);
          });
      } else {
        return res.status(400).json({ error: 'Note already liked' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikeNote = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('noteId', '==', req.params.noteId)
    .limit(1);

  const noteDocument = db.doc(`/notes/${req.params.noteId}`);

  let noteData;

  noteDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        noteData = doc.data();
        noteData.noteId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Note not found' });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: 'Note not liked' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            noteData.likeCount--;
            return noteDocument.update({ likeCount: noteData.likeCount });
          })
          .then(() => {
            res.json(noteData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.deleteNote = (req, res) => {
  const document = db.doc(`/notes/${req.params.noteId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Note not found' });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'note deleted successfully' });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

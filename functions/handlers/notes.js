const { db } = require('../util/admin');

exports.getAllNotes = (req, res) => {
  db.collection('notes')
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
    .catch(err => {
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
    createdAt: new Date().toISOString()
  };

  db.collection('notes')
    .add(newNote)
    .then(doc => {
      res.json({ message: `document ${doc.id} created succesfully` });
    })
    .catch(err => {
      res.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
};

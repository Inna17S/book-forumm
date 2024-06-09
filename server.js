const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors'); 


const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://book-club-ac0b6.firebaseio.com" 
});

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors()); 


app.get('/comments', async (req, res) => {
  const bookId = req.query.bookId;
  const lastVisible = req.query.lastVisible || null;
  const pageSize = parseInt(req.query.pageSize) || 5;

  try {
    let commentsQuery = db.collection('books').doc(bookId).collection('comments').orderBy('timestamp', 'desc').limit(pageSize);

    if (lastVisible) {
      const lastDoc = await db.collection('books').doc(bookId).collection('comments').doc(lastVisible).get();
      commentsQuery = commentsQuery.startAfter(lastDoc);
    }

    const commentsSnapshot = await commentsQuery.get();
    const comments = [];
    let lastVisibleDoc = null;

    commentsSnapshot.forEach(doc => {
      comments.push({ id: doc.id, ...doc.data() });
      lastVisibleDoc = doc;
    });

    res.json({ comments, lastVisible: lastVisibleDoc ? lastVisibleDoc.id : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

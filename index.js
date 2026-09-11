const express = require('express');
const urlRoutes = require('./routes/url');
const { connectToMongoDB } = require('./connect');
const { handleRedirectShortURL } = require('./controllers/url');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());

connectToMongoDB()
  .then(() => {
    console.log('MongoDB Connected ✅'); 

    app.listen(PORT, () => console.log(`Server started at PORT:${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));

app.get('/:shortId', handleRedirectShortURL);
app.use('/url', urlRoutes);

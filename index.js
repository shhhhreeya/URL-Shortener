const express = require('express');
const urlRoutes = require('./routes/url');
const { connectToMongoDB } = require('./connect');
const { handleRedirectShortURL } = require('./controllers/url');
const URL = require('./models/url');
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

app.use(express.json());
app.get('/:shortId', async (req, res) => {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate({
      shortId
    }, {$push:{visitHistory: {timestamp: Date.now()},},});
    res.redirect(entry.redirectURL);
});
app.use('/url', urlRoutes);

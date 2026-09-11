const express = require('express');
const router = express.Router();
const {
    handleGenerateShortURL,
    handleGetAnalytics,
    handleRedirectShortURL
} = require('../controllers/url');

router.post('/', handleGenerateShortURL);
router.get('/analytics/:shortId', handleGetAnalytics);
router.get('/:shortId', handleRedirectShortURL);

module.exports = router;
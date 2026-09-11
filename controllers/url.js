const { nanoid } = require('nanoid');
const URLModel = require('../models/url');

async function handleGenerateShortURL(req, res) {
    const originalURL = req.body?.url;

    if (!originalURL) {
        return res.status(400).json({ error: 'redirectURL is required' });
    }

    try {
        new URL(originalURL);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    const shortId = nanoid(8);

    await URLModel.create({
        shortId,
        redirectURL: originalURL,
        visitHistory: []
    });

    return res.status(201).json({
        id: shortId,
        shortURL: `${req.protocol}://${req.get('host')}/${shortId}`
    });
}

async function handleRedirectShortURL(req, res) {
    const { shortId } = req.params;

    const existingURL = await URLModel.findOne({ shortId });
    if (!existingURL) {
        return res.status(404).json({ error: 'Short URL not found' });
    }

    existingURL.visitHistory.push({ timestamp: Date.now() });
    await existingURL.save();

    return res.redirect(existingURL.redirectURL);
}

async function handleGetAnalytics(req, res) {
    const { shortId } = req.params;

    const existingURL = await URLModel.findOne({ shortId });
    if (!existingURL) {
        return res.status(404).json({ error: 'Short URL not found' });
    }

    return res.json({
        shortId,
        redirectURL: existingURL.redirectURL,
        totalClicks: existingURL.visitHistory.length,
        visitHistory: existingURL.visitHistory
    });
}

module.exports = {
    handleGenerateShortURL,
    handleRedirectShortURL,
    handleGetAnalytics
};
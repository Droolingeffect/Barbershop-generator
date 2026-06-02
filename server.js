// server.js — Express backend that proxies Google Places API v1 calls.
// The API key lives in .env and never touches the browser.

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Fields we ask Google for. Keep this list in sync with frontend expectations.
const FIELD_MASK = [
  'displayName',
  'rating',
  'userRatingCount',
  'formattedAddress',
  'nationalPhoneNumber',
  'reviews',
  'photos',
  'currentOpeningHours',
  'websiteUri',
  'location',
  'googleMapsUri'
].join(',');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// GET /api/place/:placeId — fetches a single place from Google Places API v1
app.get('/api/place/:placeId', async (req, res) => {
  const { placeId } = req.params;

  if (!API_KEY) {
    return res.status(500).json({
      error: 'Server is missing GOOGLE_PLACES_API_KEY. Add it to .env and restart.'
    });
  }

  if (!placeId || !/^[A-Za-z0-9_-]+$/.test(placeId)) {
    return res.status(400).json({ error: 'Invalid Place ID format.' });
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`;

  try {
    const googleRes = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK
      }
    });

    const data = await googleRes.json();

    if (!googleRes.ok) {
      // Google returned a structured error; forward a clean version.
      const message =
        (data && data.error && data.error.message) ||
        `Google API responded with status ${googleRes.status}`;
      const status = googleRes.status === 404 ? 404 : 502;
      return res.status(status).json({ error: message });
    }

    return res.json(data);
  } catch (err) {
    console.error('Places API fetch failed:', err);
    return res.status(500).json({ error: 'Failed to reach Google Places API.' });
  }
});

// Health check — handy for Vercel and uptime monitors.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: Boolean(API_KEY) });
});

// SPA fallback — any non-API route serves the frontend.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only listen when run directly (Vercel imports the module instead).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Barbershop generator running at http://localhost:${PORT}`);
    if (!API_KEY) {
      console.warn('Warning: GOOGLE_PLACES_API_KEY is not set. Copy .env.example to .env.');
    }
  });
}

module.exports = app;

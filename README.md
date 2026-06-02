# Barbershop Site Generator

🔗 **Live Demo:** [https://barbershop-generator.vercel.app](https://barbershop-generator.vercel.app)

Generate a clean, mobile-friendly one-page website for any business on Google Maps from just a Place ID. Built for Dubai barbershops but works for anything Google indexes.

## How it works

- **Backend**: Node + Express. Calls the Google Places API v1 with your secret key, returns JSON to the browser.
- **Frontend**: Plain HTML/CSS/JS. Renders business name, rating, address, phone, opening hours, and up to 5 real reviews.
- **API key is server-side only.** The browser never sees it.

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Set up your API key
cp .env.example .env
# Open .env and paste your Google Places API key

# 3. Start the server
node server.js
```

Open <http://localhost:3000>, paste a Google Place ID (try `ChIJp4JiUCNP0xQR1JaSjpW_Hms`), and hit **Generate Site**.

### Requirements
- Node.js 18+ (uses built-in `fetch`)
- A Google Cloud project with the **Places API (New)** enabled
- A Places API key — see [Google's docs](https://developers.google.com/maps/documentation/places/web-service/get-api-key)

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **Import Project** and pick the repo.
3. Under **Environment Variables**, add `GOOGLE_PLACES_API_KEY` with your key.
4. Click **Deploy**. That's it — `vercel.json` handles the routing.

Or from the CLI:

```bash
npm i -g vercel
vercel
vercel env add GOOGLE_PLACES_API_KEY
vercel --prod
```

## Project structure

```
barbershop-generator/
├── server.js          # Express server + /api/place/:placeId endpoint
├── public/
│   ├── index.html     # Landing form + generated site view
│   ├── style.css      # Warm walnut/brass barbershop theme
│   └── script.js      # Fetch + render logic
├── .env               # Your real API key (gitignored)
├── .env.example       # Template
├── vercel.json        # Routes /api/* to server.js
└── package.json
```

## Finding a Place ID

Use Google's [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) — search for a business and copy the ID from the info window.

## Error handling

- **Invalid Place ID format** → 400 from the API
- **Place not found** → 404 surfaced to the UI
- **Google rejects the request** (bad key, referrer restriction, quota) → the real Google error message is shown
- **Missing fields** (e.g. no phone or website) → those rows are hidden gracefully

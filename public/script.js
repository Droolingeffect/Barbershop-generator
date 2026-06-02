// script.js — fetches business data from our Node backend and renders it.

const els = {
  landing: document.getElementById('landing'),
  site: document.getElementById('site'),
  loading: document.getElementById('loading'),
  form: document.getElementById('generate-form'),
  input: document.getElementById('place-id'),
  generateBtn: document.getElementById('generate-btn'),
  backBtn: document.getElementById('back-btn'),
  formError: document.getElementById('form-error'),
  bizName: document.getElementById('biz-name'),
  stars: document.getElementById('biz-stars'),
  ratingNum: document.getElementById('biz-rating-num'),
  reviewCount: document.getElementById('biz-review-count'),
  address: document.getElementById('biz-address'),
  phone: document.getElementById('biz-phone'),
  website: document.getElementById('biz-website'),
  hoursList: document.getElementById('hours-list'),
  reviewsList: document.getElementById('reviews-list')
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const placeId = els.input.value.trim();
  if (!placeId) {
    showError('Please enter a Google Place ID.');
    return;
  }
  await loadBusiness(placeId);
});

els.backBtn.addEventListener('click', () => {
  els.site.hidden = true;
  els.landing.hidden = false;
  document.title = 'Barbershop Site Generator';
});

document.getElementById('export-btn').addEventListener('click', exportSite);

async function exportSite() {
  const btn = document.getElementById('export-btn');
  const original = btn.textContent;
  btn.textContent = 'Exporting…';
  btn.disabled = true;

  try {
    const cssRes = await fetch('/style.css');
    const css = await cssRes.text();

    const name = els.bizName.textContent || 'business';
    const slug = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Clone site contents, strip toolbar so export has no nav buttons
    const clone = document.getElementById('site').cloneNode(true);
    const toolbar = clone.querySelector('.site-toolbar');
    if (toolbar) toolbar.remove();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
  <main class="site" style="display:block !important">
    ${clone.innerHTML}
  </main>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = slug + '.html';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Export failed: ' + err.message);
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

async function loadBusiness(placeId) {
  els.generateBtn.disabled = true;
  els.loading.hidden = false;

  try {
    const res = await fetch(`/api/place/${encodeURIComponent(placeId)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    render(data);
    els.landing.hidden = true;
    els.site.hidden = false;
    window.scrollTo(0, 0);
  } catch (err) {
    console.error(err);
    showError(err.message || 'Something went wrong fetching the business.');
  } finally {
    els.generateBtn.disabled = false;
    els.loading.hidden = true;
  }
}

function render(data) {
  // Business name
  const name = (data.displayName && data.displayName.text) || 'Unnamed Business';
  els.bizName.textContent = name;
  document.title = `${name} — Barbershop`;

  // Rating
  if (typeof data.rating === 'number') {
    els.stars.textContent = renderStars(data.rating);
    els.ratingNum.textContent = data.rating.toFixed(1);
    const count = data.userRatingCount || 0;
    els.reviewCount.textContent = `(${count.toLocaleString()} reviews)`;
  } else {
    els.stars.textContent = '';
    els.ratingNum.textContent = 'No rating yet';
    els.reviewCount.textContent = '';
  }

  // Address
  if (data.formattedAddress) {
    const mapsUrl =
      data.googleMapsUri ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.formattedAddress)}`;
    els.address.textContent = `📍 ${data.formattedAddress}`;
    els.address.href = mapsUrl;
    els.address.hidden = false;
  } else {
    els.address.hidden = true;
  }

  // Phone
  if (data.nationalPhoneNumber) {
    els.phone.textContent = `📞 ${data.nationalPhoneNumber}`;
    els.phone.href = `tel:${data.nationalPhoneNumber.replace(/\s+/g, '')}`;
    els.phone.hidden = false;
  } else {
    els.phone.hidden = true;
  }

  // Website
  if (data.websiteUri) {
    els.website.textContent = `🌐 ${prettyUrl(data.websiteUri)}`;
    els.website.href = data.websiteUri;
    els.website.hidden = false;
  } else {
    els.website.hidden = true;
  }

  // Hours
  renderHours(data.currentOpeningHours);

  // Reviews
  renderReviews(data.reviews || []);
}

function renderStars(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

function prettyUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function renderHours(hoursObj) {
  els.hoursList.innerHTML = '';

  // Places API v1 returns weekdayDescriptions like "Monday: 9:00 AM – 10:00 PM"
  const descriptions = hoursObj && hoursObj.weekdayDescriptions;
  if (Array.isArray(descriptions) && descriptions.length) {
    descriptions.forEach((line) => {
      const [day, ...rest] = line.split(':');
      const time = rest.join(':').trim();
      const li = document.createElement('li');
      const dayEl = document.createElement('span');
      dayEl.className = 'day';
      dayEl.textContent = day;
      const timeEl = document.createElement('span');
      timeEl.className = /closed/i.test(time) ? 'time closed' : 'time';
      timeEl.textContent = time || '—';
      li.append(dayEl, timeEl);
      els.hoursList.appendChild(li);
    });
    return;
  }

  // Fallback: parse periods if weekdayDescriptions is missing.
  const periods = hoursObj && hoursObj.periods;
  if (Array.isArray(periods) && periods.length) {
    const byDay = new Map();
    periods.forEach((p) => {
      if (!p.open) return;
      const day = p.open.day;
      const openT = formatTime(p.open);
      const closeT = p.close ? formatTime(p.close) : '24h';
      byDay.set(day, `${openT} – ${closeT}`);
    });
    for (let i = 0; i < 7; i++) {
      const li = document.createElement('li');
      const dayEl = document.createElement('span');
      dayEl.className = 'day';
      dayEl.textContent = DAY_NAMES[i];
      const timeEl = document.createElement('span');
      const t = byDay.get(i);
      timeEl.className = t ? 'time' : 'time closed';
      timeEl.textContent = t || 'Closed';
      li.append(dayEl, timeEl);
      els.hoursList.appendChild(li);
    }
    return;
  }

  // No hours data at all.
  const li = document.createElement('li');
  li.innerHTML = '<span class="day">Hours</span><span class="time">Not available</span>';
  els.hoursList.appendChild(li);
}

function formatTime(t) {
  const hh = String(t.hour).padStart(2, '0');
  const mm = String(t.minute || 0).padStart(2, '0');
  return `${hh}:${mm}`;
}

function renderReviews(reviews) {
  els.reviewsList.innerHTML = '';

  if (!reviews.length) {
    const empty = document.createElement('p');
    empty.style.color = 'var(--text-muted)';
    empty.style.margin = '0';
    empty.textContent = 'No reviews available for this business yet.';
    els.reviewsList.appendChild(empty);
    return;
  }

  reviews.slice(0, 5).forEach((review) => {
    const card = document.createElement('div');
    card.className = 'review-card';

    const header = document.createElement('div');
    header.className = 'review-header';

    const author = document.createElement('span');
    author.className = 'review-author';
    author.textContent =
      (review.authorAttribution && review.authorAttribution.displayName) || 'Anonymous';

    const meta = document.createElement('span');
    meta.className = 'review-meta';

    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.textContent = renderStars(review.rating || 0);

    const time = document.createElement('span');
    time.textContent = review.relativePublishTimeDescription || '';

    meta.append(stars, time);
    header.append(author, meta);

    const text = document.createElement('p');
    text.className = 'review-text';
    text.textContent =
      (review.text && review.text.text) ||
      (review.originalText && review.originalText.text) ||
      '(No comment provided.)';

    card.append(header, text);
    els.reviewsList.appendChild(card);
  });
}

function showError(msg) {
  els.formError.textContent = msg;
  els.formError.hidden = false;
}

function hideError() {
  els.formError.hidden = true;
  els.formError.textContent = '';
}

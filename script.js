/* Movie search frontend using The Movie Database (TMDB) API.
	 Requires a `config.js` that sets `window.TMDB_API_KEY = 'your_key'`.
	 See config.example.js for a template.
*/

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Simple in-memory search cache to reduce API calls during rapid typing
const searchCache = new Map();
const CACHE_MAX = 120; // max cached queries

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const elements = {
	searchInput: '#searchInput',
	searchBtn: '#searchBtn',
	results: '#results',
	modal: '#modal',
	modalBody: '#modalBody',
	closeModal: '#closeModal'
};

function getApiKey() {
	if (window && window.TMDB_API_KEY) return window.TMDB_API_KEY;
	return null;
}

function showMessage(parent, msg) {
	parent.innerHTML = `<div class="message">${msg}</div>`;
}

async function searchMovies(query) {
	const key = getApiKey();
	if (!key) throw new Error('TMDB API key not found. Create config.js from config.example.js');
	const url = `${TMDB_BASE}/search/movie?api_key=${key}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false`;
	const r = await fetch(url);
	if (!r.ok) throw new Error('Search request failed');
	const data = await r.json();
	return data.results || [];
}

async function fetchMovieDetails(id) {
	const key = getApiKey();
	const url = `${TMDB_BASE}/movie/${id}?api_key=${key}&language=en-US&append_to_response=videos,credits`;
	const r = await fetch(url);
	if (!r.ok) throw new Error('Details request failed');
	return r.json();
}

function createCard(movie) {
	const img = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
	const tiny = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
	const year = movie.release_date ? `(${movie.release_date.slice(0,4)})` : '';
	const overview = movie.overview ? movie.overview : 'No description available.';
	const el = document.createElement('div');
	el.className = 'card';
	el.tabIndex = 0; // make card focusable for keyboard navigation
	el.setAttribute('role', 'button');
	el.innerHTML = `
		<div class="poster"><img data-src="${img}" src="${tiny}" class="lazy" alt="${escapeHtml(movie.title)} poster" loading="lazy"></div>
		<div class="meta">
			<h3 class="title">${escapeHtml(movie.title)} <span class="year">${year}</span></h3>
			<p class="overview">${escapeHtml(snippet(overview, 160))}</p>
			<div class="actions"><button data-id="${movie.id}" class="detailsBtn">View</button></div>
		</div>
	`;
	return el;
}

function escapeHtml(str) {
	return String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function snippet(text, n) {
	return text.length > n ? text.slice(0, n).trim() + '…' : text;
}

function clearResults() {
	$(elements.results).innerHTML = '';
}

function showHome() {
	const home = document.getElementById('home');
	const results = document.getElementById('results');
	if (home) home.style.display = '';
	if (results) results.style.display = 'none';
}

function showResultsView() {
	const home = document.getElementById('home');
	const results = document.getElementById('results');
	if (home) home.style.display = 'none';
	if (results) results.style.display = '';
}

function renderResults(movies) {
	const container = $(elements.results);
	container.innerHTML = '';
	if (!movies.length) {
		showMessage(container, 'No results. Try a different title.');
		return;
	}
	const grid = document.createElement('div');
	grid.className = 'cards';
	movies.forEach((m, idx) => {
		const c = createCard(m);
		c.dataset.index = String(idx);
		grid.appendChild(c);
	});
	container.appendChild(grid);
	// set a sensible focus outline for keyboard users
	const first = container.querySelector('.card');
	if (first) first.setAttribute('aria-label', 'Search result');

	// insert inline ad placeholders every 6 cards
	insertInlineAds(grid, 6);
}

// Ad helper: insert ad slot elements into a results grid every `interval` items
function insertInlineAds(gridEl, interval = 6) {
	if (!gridEl || !gridEl.children) return;
	// remove existing inline ads first
	Array.from(gridEl.querySelectorAll('.inline-ad')).forEach(n => n.remove());
	// iterate and inject
	for (let i = interval; i < gridEl.children.length; i += (interval + 1)) {
		const ad = document.createElement('div');
		ad.className = 'card inline-ad';
		ad.innerHTML = `<div class="ad-inner">Inline Ad</div>`;
		// insert before child at position i
		const before = gridEl.children[i];
		if (before) gridEl.insertBefore(ad, before);
		else gridEl.appendChild(ad);
	}
	// notify ad network hooks that slots are available
	notifyAdSlots();
}

// Public ad API: networks can register a callback that's called whenever new ad slots appear
window._adHooks = window._adHooks || [];
function registerAdHook(fn) {
	if (typeof fn === 'function') window._adHooks.push(fn);
}
function notifyAdSlots() {
	try {
		window._adHooks.forEach(fn => {
			try { fn(); } catch (e) { /* swallow */ }
		});
	} catch (_) {}
}

// expose registration globally
window.registerAdHook = registerAdHook;

// --- Consent Management for Ads (simple CMP stub) ---
const CONSENT_KEY = 'consent_ads_v1';

function hasConsent() {
	try { return localStorage.getItem(CONSENT_KEY) === 'granted'; } catch (_) { return false; }
}

function setConsent(val) {
	try { localStorage.setItem(CONSENT_KEY, val); } catch (_) {}
}

function showConsentBanner() {
	if (document.getElementById('consentBanner')) return;
	const el = document.createElement('div');
	el.id = 'consentBanner';
	el.className = 'consent-banner';
	el.innerHTML = `
		<div class="consent-inner">
			<div class="consent-text">We use ads to support this site. By clicking "Accept" you agree to cookies and personalized ads.</div>
			<div class="consent-actions">
				<button id="consentAccept" class="btn primary">Accept</button>
				<button id="consentDecline" class="btn">Decline</button>
			</div>
		</div>
	`;
	document.body.appendChild(el);

	document.getElementById('consentAccept').addEventListener('click', () => {
		setConsent('granted');
		el.remove();
		// load ad script (ads.js) if present and notify hooks
		loadAdsScript('ads.js');
	});
	document.getElementById('consentDecline').addEventListener('click', () => {
		setConsent('denied');
		el.remove();
	});
}

function loadAdsScript(src = 'ads.js') {
	// attempt to load a local ads script which should register ad hooks
	try {
		const s = document.createElement('script');
		s.src = src;
		s.async = true;
		s.onload = () => {
			// allow the ad script to register hooks, then notify
			setTimeout(() => notifyAdSlots(), 100);
		};
		s.onerror = () => {
			// no ads script present; still notify hooks in case they were included elsewhere
			notifyAdSlots();
		};
		document.head.appendChild(s);
	} catch (_) {
		notifyAdSlots();
	}
}

function openModal() {
	const modal = $(elements.modal);
	modal.classList.remove('hidden');
	setTimeout(() => modal.classList.add('open'), 20);
}

function closeModal() {
	const modal = $(elements.modal);
	modal.classList.remove('open');
	setTimeout(() => modal.classList.add('hidden'), 200);
}

function renderMovieDetails(details) {
	const poster = details.poster_path ? `${IMG_BASE}${details.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
	const genres = (details.genres || []).map(g => g.name).join(', ');
	const runtime = details.runtime ? `${details.runtime} min` : 'Unknown';
	const cast = (details.credits && details.credits.cast) ? details.credits.cast.slice(0,8) : [];
	const trailer = (details.videos && details.videos.results)
		? details.videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
		: null;

	const body = $(elements.modalBody);
	body.innerHTML = `
		<div class="detail-grid">
			<div class="detail-poster"><img src="${poster}" alt="poster"></div>
			<div class="detail-info">
				<h2>${escapeHtml(details.title || details.name || '')} <span class="muted">${details.release_date ? '('+details.release_date.slice(0,4)+')' : ''}</span></h2>
				<p class="tagline">${escapeHtml(details.tagline || '')}</p>
				<p class="overview-full">${escapeHtml(details.overview || 'No description available.')}</p>
				<p><strong>Genres:</strong> ${escapeHtml(genres || '—')}</p>
				<p><strong>Runtime:</strong> ${escapeHtml(runtime)}</p>
				<p><strong>Cast:</strong> ${escapeHtml(cast.map(c => c.name).join(', ') || '—')}</p>
				${trailer ? `<div class="trailer"><iframe id="modalTrailer" src="https://www.youtube.com/embed/${trailer.key}?rel=0" title="Trailer" frameborder="0" allowfullscreen></iframe></div>` : ''}

				${(trailer && details.runtime) ? (function(){
					// compute estimated act timestamps (25%, 50%, 75%)
					const runtimeMin = details.runtime || 0;
					const runtimeSec = runtimeMin * 60;
					const acts = [0.25, 0.5, 0.75].map(p => Math.max(0, Math.floor(runtimeSec * p)));
					let actsHtml = `<div class="estimated-acts"><h3>Estimated Acts</h3><div class="acts">`;
					acts.forEach((sec, idx) => {
						const m = Math.floor(sec/60); const s = sec % 60; const label = ['Act I','Midpoint','Climax'][idx] || `Part ${idx+1}`;
						actsHtml += `<button class="act-btn" data-start="${sec}" data-key="${trailer.key}" data-movie-id="${details.id}">${label} — ${m}:${String(s).padStart(2,'0')}</button>`;
					});
					actsHtml += `</div><p class="acts-note">These are estimated act break timestamps calculated from runtime (approx.). Use them to preview relevant moments in the trailer.</p></div>`;
					return actsHtml;
				})() : ''}
			</div>
		</div>
	`;

	// Inject JSON-LD for the movie to improve SEO (only when details are present)
	try {
		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "Movie",
			"name": details.title || details.name || '',
			"image": poster,
			"description": details.overview || '',
			"datePublished": details.release_date || undefined,
			"genre": (details.genres || []).map(g => g.name),
			"duration": details.runtime ? `PT${details.runtime}M` : undefined,
			"actor": (details.credits && details.credits.cast) ? details.credits.cast.slice(0,8).map(c => ({ "@type": "Person", "name": c.name })) : undefined
		};
		// remove undefineds
		Object.keys(jsonLd).forEach(k => jsonLd[k] === undefined && delete jsonLd[k]);
		let ld = document.getElementById('jsonld-movie');
		if (!ld) {
			ld = document.createElement('script');
			ld.type = 'application/ld+json';
			ld.id = 'jsonld-movie';
			document.head.appendChild(ld);
		}
		ld.textContent = JSON.stringify(jsonLd);
	} catch (e) { /* ignore JSON-LD failures */ }

	// small analytics hook: record that a movie detail was viewed
	trackEvent('movie_view', { movie_id: details.id, title: details.title || details.name });
}

function setLoading(state, isLive = false) {
	const btn = $(elements.searchBtn);
	btn.disabled = state;
	if (!isLive) btn.textContent = state ? 'Searching' : 'Search';
	// show a skeleton in the results area when live typing search is happening
	if (isLive) {
		if (state) showSkeleton(8);
		// when stopping live loading, renderResults will replace skeleton
	}
}

function showSkeleton(count = 8) {
	const container = $(elements.results);
	container.innerHTML = '';
	const grid = document.createElement('div');
	grid.className = 'cards';
	for (let i = 0; i < count; i++) {
		const el = document.createElement('div');
		el.className = 'card skeleton';
		el.innerHTML = `
			<div class="poster"><div class="shimmer"></div></div>
			<div class="meta">
				<div class="line short"></div>
				<div class="line"></div>
				<div class="line small"></div>
			</div>
		`;
		grid.appendChild(el);
	}
	container.appendChild(grid);
}

async function doSearch(q) {
	if (!q || !q.trim()) return;
	setLoading(true);
	clearResults();
	showResultsView();
	try {
		const movies = await searchMovies(q.trim());
		renderResults(movies);
	} catch (err) {
		showMessage($(elements.results), `Error: ${err.message}`);
	} finally {
		setLoading(false);
	}
}

function attachHandlers() {
	const input = $(elements.searchInput);
	const btn = $(elements.searchBtn);

	// keyboard: Enter to search immediately
	btn.addEventListener('click', () => doSearch(input.value));
	input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(input.value); });

	// Real-time search: debounce input and cancel in-flight requests to avoid races
	let debounceTimer = null;
	let currentController = null;
	const MIN_CHARS = 2;

	const debouncedSearch = (q) => {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(async () => {
			// cancel previous
			if (currentController) {
				try { currentController.abort(); } catch (_) {}
				currentController = null;
			}

			const trimmed = q.trim();
			if (!trimmed || trimmed.length < MIN_CHARS) {
				// clear results when user erased the query or too short
				clearResults();
				return;
			}

			// create new controller for this request
			currentController = new AbortController();
			setLoading(true, true);
			try {
				const movies = await searchMoviesLive(trimmed, currentController.signal);
				renderResults(movies);
			} catch (err) {
				if (err.name === 'AbortError') {
					// expected when a newer request supersedes this one
					return;
				}
				showMessage($(elements.results), `Error: ${err.message}`);
			} finally {
				setLoading(false, true);
			}
		}, 300); // 300ms debounce
	};

	input.addEventListener('input', (e) => debouncedSearch(e.target.value));
	// allow ArrowDown from input to focus first result
	input.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowDown') {
			const first = document.querySelector('.card');
			if (first) { first.focus(); e.preventDefault(); }
		}
	});

	// delegate details button clicks (opens modal and deep-links via history)
	$(elements.results).addEventListener('click', async (e) => {
		const btn = e.target.closest('.detailsBtn');
		if (!btn) return;
		const id = btn.dataset.id;
		try {
			// push a shareable URL pointing at the per-movie page
			const stateObj = { movieOverlay: true, id };
			try { history.pushState(stateObj, '', `movie.html?id=${id}`); } catch (err) { /* ignore */ }
			showMessage($(elements.modalBody), 'Loading...');
			openModal();
			const details = await fetchMovieDetails(id);
			renderMovieDetails(details);
		} catch (err) {
			showMessage($(elements.modalBody), `Error: ${err.message}`);
		}
	});

	// Close button: if the current history state is a movie overlay, go back so the URL restores; otherwise close directly.
	$(elements.closeModal).addEventListener('click', () => {
		if (history.state && history.state.movieOverlay) history.back(); else closeModal();
	});
	$(elements.modal).addEventListener('click', (e) => { if (e.target === $(elements.modal)) { if (history.state && history.state.movieOverlay) history.back(); else closeModal(); } });

	// keyboard navigation inside results (arrow keys + Enter)
	$(elements.results).addEventListener('keydown', (e) => {
		const card = e.target.closest('.card');
		if (!card) return;
		const grid = card.parentElement;
		if (!grid) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			const next = card.nextElementSibling;
			if (next) { next.focus(); e.preventDefault(); }
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			const prev = card.previousElementSibling;
			if (prev) { prev.focus(); e.preventDefault(); }
		} else if (e.key === 'Enter' || e.key === ' ') {
			const btn = card.querySelector('.detailsBtn');
			if (btn) btn.click();
			e.preventDefault();
		}
	});
}

// search function that accepts an AbortSignal so real-time can cancel
async function searchMoviesLive(query, signal) {
	const key = getApiKey();
	if (!key) throw new Error('TMDB API key not found. Create config.js from config.example.js');
	const url = `${TMDB_BASE}/search/movie?api_key=${key}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false`;
	const cacheKey = query.toLowerCase();
	if (searchCache.has(cacheKey)) {
		return searchCache.get(cacheKey);
	}
	const r = await fetch(url, { signal });
	if (!r.ok) throw new Error('Search request failed');
	const data = await r.json();
	const results = data.results || [];
	// cache result (simple LRU-ish eviction)
	try {
		searchCache.set(cacheKey, results);
		if (searchCache.size > CACHE_MAX) {
			// evict oldest entry
			const firstKey = searchCache.keys().next().value;
			searchCache.delete(firstKey);
		}
	} catch (_) { /* ignore cache errors */ }
	return results;
}

// small UX helper: pre-populate with a popular movie sample
function initSample() {
	const input = $(elements.searchInput);
	input.value = 'inception';
	doSearch(input.value);
}

// bootstrap
document.addEventListener('DOMContentLoaded', async () => {
	attachHandlers();
	// Try to auto-load a local config copy (config.local.js) for dev convenience
	await loadLocalConfigIfPresent();

	// sanity: warn if API key missing
	if (!getApiKey()) {
		const r = confirm('TMDB API key not found. Would you like to open the README to see setup steps?');
		if (r) window.open('README.md', '_blank');
	} else {
		// initialize home view and sample
		initHome();
		initSample();
	}
});

async function loadLocalConfigIfPresent() {
	if (getApiKey()) return true;
	try {
		// quick probe to see if config.local.js exists on the server
		const resp = await fetch('config.local.js', { method: 'GET', cache: 'no-store' });
		if (!resp.ok) return false;
		// load it as a script so it sets window.TMDB_API_KEY
		return new Promise((resolve) => {
			const s = document.createElement('script');
			s.src = 'config.local.js';
			s.async = true;
			s.onload = () => { resolve(!!getApiKey()); };
			s.onerror = () => { resolve(false); };
			document.head.appendChild(s);
		});
	} catch (_) {
		return false;
	}
}

// ----- Analytics (GA4) loader + event helper -----
function loadGA4(measurementId) {
	if (!measurementId) return;
	if (window._gaLoaded) return;
	window.dataLayer = window.dataLayer || [];
	function gtag(){dataLayer.push(arguments);} // eslint-disable-line no-inner-declarations
	window.gtag = gtag;
	gtag('js', new Date());
	gtag('config', measurementId, { 'send_page_view': false });
	const s = document.createElement('script');
	s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
	s.async = true;
	s.onload = () => { window._gaLoaded = true; };
	document.head.appendChild(s);
}

function trackEvent(name, params = {}) {
	try {
		if (window.gtag) {
			window.gtag('event', name, params);
		}
	} catch (_) { }
}

// Auto-load GA4 if measurement ID provided in config (config.local.js may set window.GA_MEASUREMENT_ID)
if (window && window.GA_MEASUREMENT_ID) {
	loadGA4(window.GA_MEASUREMENT_ID);
}

// Newsletter simple handler: stores email locally (demo stub) and fires an analytics event.
document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('newsletterForm');
	if (!form) return;
	const emailInput = document.getElementById('newsletterEmail');
	const msg = document.getElementById('newsletterMsg');
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = (emailInput.value || '').trim();
		if (!email) {
			msg.textContent = 'Enter a valid email.';
			return;
		}
		const endpoint = (window && window.NEWSLETTER_ENDPOINT) ? window.NEWSLETTER_ENDPOINT : null;
		if (endpoint) {
			try {
				const res = await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});
				if (res.ok) {
					msg.textContent = 'Thanks — you are subscribed.';
					trackEvent('newsletter_subscribe', { email: email });
				} else {
					msg.textContent = 'Subscription failed.';
				}
			} catch (err) {
				// fallback to localStorage
				try {
					const list = JSON.parse(localStorage.getItem('newsletter_v1') || '[]');
					if (!list.includes(email)) list.push(email);
					localStorage.setItem('newsletter_v1', JSON.stringify(list));
					msg.textContent = 'Thanks — you are subscribed (offline fallback).';
					trackEvent('newsletter_subscribe', { email: email });
				} catch (e) {
					msg.textContent = 'Subscription failed.';
				}
			}
		} else {
			try {
				const list = JSON.parse(localStorage.getItem('newsletter_v1') || '[]');
				if (!list.includes(email)) list.push(email);
				localStorage.setItem('newsletter_v1', JSON.stringify(list));
				msg.textContent = 'Thanks — you are subscribed (demo).';
				trackEvent('newsletter_subscribe', { email: email });
			} catch (err) {
				msg.textContent = 'Subscription failed.';
			}
		}
		form.reset();
	});
});

// --- Home page functions ---
async function tmdbFetch(path) {
	const key = getApiKey();
	const url = `${TMDB_BASE}${path}?api_key=${key}&language=en-US`;
	const r = await fetch(url);
	if (!r.ok) throw new Error('TMDB request failed');
	return r.json();
}

async function initHome() {
	try {
		showSkeleton(6);
		const [trending, popular, topRated, upcoming] = await Promise.all([
			tmdbFetch('/trending/movie/week'),
			tmdbFetch('/movie/popular'),
			tmdbFetch('/movie/top_rated'),
			tmdbFetch('/movie/upcoming')
		]);

		renderHero((trending.results && trending.results[0]) || (popular.results && popular.results[0]));
		renderRow('Trending', (trending.results || []));
		renderRow('Popular', (popular.results || []));
		renderRow('Top Rated', (topRated.results || []));
		renderRow('Upcoming', (upcoming.results || []));
		renderMovieOfDay(popular.results || []);
	} catch (err) {
		showMessage($(elements.results), `Home load error: ${err.message}`);
	}
}

function renderHero(movie) {
	const hero = document.getElementById('hero');
	if (!hero || !movie) return;
	const img = movie.backdrop_path ? `${IMG_BASE}${movie.backdrop_path}` : (movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : 'https://via.placeholder.com/1200x500');
	hero.innerHTML = `
		<div class="hero-inner lazy-hero" data-bg="${img}">
			<div class="hero-content">
				<h2>${escapeHtml(movie.title)}</h2>
				<p class="hero-overview">${escapeHtml(snippet(movie.overview || '', 240))}</p>
				<div class="hero-actions"><button class="detailsBtn" data-id="${movie.id}">View</button></div>
			</div>
		</div>
	`;
	// lazy load background
	const heroInner = hero.querySelector('.hero-inner');
	if (heroInner) {
		const url = heroInner.dataset.bg;
		// use simple Image to preload
		const imgPre = new Image();
		imgPre.src = url;
		imgPre.onload = () => { heroInner.style.backgroundImage = `url('${url}')`; };
	}
	// wire hero details button
	hero.querySelector('.detailsBtn')?.addEventListener('click', async (e) => {
		const id = e.target.dataset.id;
		showMessage($(elements.modalBody), 'Loading...');
		openModal();
		const details = await fetchMovieDetails(id);
		renderMovieDetails(details);
	});
}

function renderRow(title, items) {
	const rows = document.getElementById('rows');
	if (!rows) return;
	const row = document.createElement('div');
	row.className = 'row';
	row.innerHTML = `
		<h3>${escapeHtml(title)}</h3>
		<div class="row-cards"></div>
	`;
	const container = row.querySelector('.row-cards');
	items.slice(0, 12).forEach(m => container.appendChild(createCard(m)));
	rows.appendChild(row);
	initLazyImages();
}

function renderMovieOfDay(list) {
	const el = document.getElementById('movieOfDay');
	if (!el || !list.length) return;
	const pick = list[Math.floor(Math.random() * list.length)];
	el.innerHTML = `
		<div class="moday">
			<h3>Movie of the Day</h3>
			<div class="moday-card">${createCard(pick).outerHTML}</div>
		</div>
	`;
	initLazyImages();
}

// lazy-loading utility
let _lazyObserver = null;
function initLazyImages() {
	if (!_lazyObserver && 'IntersectionObserver' in window) {
		_lazyObserver = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (!entry.isIntersecting) return;
				const img = entry.target;
				const src = img.getAttribute('data-src');
				if (src) {
					img.src = src;
					img.removeAttribute('data-src');
				}
				img.classList.remove('lazy');
				_lazyObserver.unobserve(img);
			});
		}, { rootMargin: '200px 0px' });
	}

	document.querySelectorAll('img.lazy').forEach(img => {
		if (_lazyObserver) _lazyObserver.observe(img);
		else { // fallback: load immediately
			const src = img.getAttribute('data-src');
			if (src) img.src = src;
		}
	});
}

// handle browser navigation to open/close the modal when state changes
window.addEventListener('popstate', async (e) => {
	const st = e.state;
	if (st && st.movieOverlay) {
		try {
			showMessage($(elements.modalBody), 'Loading...');
			openModal();
			const details = await fetchMovieDetails(st.id);
			renderMovieDetails(details);
		} catch (err) {
			showMessage($(elements.modalBody), `Error: ${err.message}`);
		}
	} else {
		// if no overlay state present, ensure modal is closed
		const modalEl = $(elements.modal);
		if (modalEl && !modalEl.classList.contains('hidden')) closeModal();
	}
});

// Estimated Acts: handle clicks on act buttons to start trailer at timestamp
document.addEventListener('click', (e) => {
	const btn = e.target.closest && e.target.closest('.act-btn');
	if (!btn) return;
	const key = btn.dataset.key;
	const start = parseInt(btn.dataset.start, 10) || 0;
	// If modal trailer iframe present, update src with start time
	const iframe = document.getElementById('modalTrailer');
	if (iframe && key) {
		// update with start param (YouTube supports ?start=SECONDS or &start=SECONDS)
		const base = `https://www.youtube.com/embed/${key}?rel=0&autoplay=1&start=${start}`;
		iframe.src = base;
	} else if (key) {
		// fallback: open a new tab to YouTube at time
		window.open(`https://www.youtube.com/watch?v=${key}&t=${start}s`, '_blank');
	}
});

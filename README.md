# Movie Search (TMDB) — light Netflix-like UI

Static frontend that searches The Movie Database (TMDB) and shows details: summary, cast, genres, runtime, poster and trailers.

Setup

1. Get a TMDB API key: https://www.themoviedb.org/settings/api
2. Copy `config.example.js` to `config.js` next to the HTML files and set your key.

Files

- `index.html` — main page
- `styles.css` — UI styles (light theme, red accent)
- `script.js` — frontend logic that calls TMDB
- `config.example.js` — template for your API key

Run
Open `index.html` in your browser (no build step required). If you want a local static server (recommended), you can use any static server. Example using Node's `http-server` (install globally):

```powershell
npx http-server -c-1 .
```

Notes

- Don't commit `config.js` with your real API key.
- The app uses TMDB's search and movie details endpoints and embeds YouTube trailers when available.

Ads

- This project includes placeholder ad slots in `index.html` (top banner, sidebar, footer) and inserts inline ad cards into the results every 6 items.
- To integrate a real ad network (AdSense/GAM or other), load the network's script in the page and then register a callback using `window.registerAdHook(fn)`.
- The hook `fn` will be called after ad slots are inserted; inside it you can render or refresh ads into elements with class `ad-slot` or `inline-ad`.

Important: do not place real ad network scripts or keys into source control while developing. Use environment-specific injection or server-side rendering for production.

AdSense setup (quick start)

1. Sign up for Google AdSense and add your site URL in the AdSense dashboard. Use the URL where you'll host this project (for local testing you can register a temporary domain or use a public test site).
2. After AdSense approves your site, you'll receive a script snippet from Google. Do NOT paste it into version-controlled files. Instead, create `ads.js` on your production host that contains the AdSense loader.
3. Use the provided `ads.example.js` as a safe template. `ads.example.js` demonstrates how to register `window.registerAdHook()` so the ad loader can render into `.ad-slot` and `.inline-ad` elements.

Consent and privacy

- If you expect traffic from GDPR regions, you must show a consent banner and block personalized ads until the user accepts. This project includes a simple CMP banner and will only load `ads.js` after the user clicks Accept.
- For production, consider integrating a full CMP (IAB TCF-compliant) or a paid provider for enterprise needs.

Prevent committing secrets

- A `.gitignore` has been added that ignores `config.js`, `ads.js`, and common env files. Make sure you keep your real API keys and ad scripts out of version control.
- Optional pre-commit hook: a sample hook is available at `hooks/pre-commit`. To enable it, run:

```powershell
copy .\hooks\pre-commit .git\hooks\pre-commit
# On Unix/macOS:
# cp hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

This hook blocks commits that include `config.js`, `ads.js`, or `.env` files. It's a convenience, not a replacement for careful secret handling.

One-time setup helper

Run the included `setup.ps1` (Windows PowerShell) to install the pre-commit hook and create local config stubs:

```powershell
.\setup.ps1
```

This will:

- copy the `hooks/pre-commit` into `.git/hooks/pre-commit`
- create a local `.env` from `.env.example` (if missing)
- move an existing `config.js` to `config.js.bak` and create `config.template.js`

Sanitizing before push

If you have local `config.js` or `ads.js`, run `sanitize_repo.ps1` to back them up (to `config.local.js`/`ads.local.js`) and untrack them from git before pushing.

```powershell
.\sanitize_repo.ps1
```
Deployment (GitHub + Netlify / Vercel)

- Repo: https://github.com/syntaxdrive/AboutMovie.git
- Quick deploy to Netlify (recommended for static + functions):

	1. Create a Netlify account and connect the GitHub repo <https://github.com/syntaxdrive/AboutMovie.git>.
	2. In Netlify site settings, set the publish directory to the repo root.
	3. Optionally add the Netlify Functions directory `netlify/functions` for the newsletter function scaffold.
	4. Add any environment variables (MAILCHIMP_API_KEY, etc.) in Site settings -> Build & deploy -> Environment.

- Quick deploy to Vercel:
	1. Create a Vercel account and import the GitHub repo.
	2. Add environment variables in the Vercel dashboard.

Ads & newsletter notes

- Example ad loaders were added: `ads.example.js` and `ads.example-adsense.js`. Copy one to `ads.js` on your production host and replace publisher IDs there.
- An `ads.txt` template was added at the project root — update with your authorized sellers before publishing.
- A Netlify serverless function scaffold is provided at `netlify/functions/subscribe.js`. Implement provider integration and set provider API keys as environment variables on Netlify/Vercel.

Search Console / Verification

- To verify your site in Google Search Console using the HTML file method, add a file named `google-site-verification-<token>.html` to your site root with the token supplied by Google. A template `google-site-verification-example.html` is included in this repo.
- Alternatively, use DNS verification if you control your domain's DNS records.

Newsletter

- The footer newsletter form will POST to the endpoint defined by `window.NEWSLETTER_ENDPOINT` if you set it in `config.local.js` (for example: `window.NEWSLETTER_ENDPOINT = 'https://api.yourservice.com/subscribe'`).
- If no endpoint is configured, the form falls back to storing subscriptions in `localStorage` (demo only). For production, implement a small serverless function (Netlify Functions, Vercel Serverless, AWS Lambda) or a provider endpoint (Mailchimp API, Buttondown) to accept and store emails securely.

Example `config.local.js` additions (DO NOT COMMIT):

```js
// TMDB key
window.TMDB_API_KEY = "your_tmdb_key_here";
// optional: GA4 measurement id
window.GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
// optional: newsletter endpoint used by the footer form
window.NEWSLETTER_ENDPOINT = "https://api.yourservice.com/subscribe";
```

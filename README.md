# Attekmi Dashboard prototype

An interactive, static recreation of the Attekmi Figma dashboard. All figures and endpoints are demo data. The dashboard runs entirely in the browser and resets on reload.

## Run locally

Open `index.html` in a browser, or serve the folder with `python3 -m http.server 8765`.

For fixture checks, open `http://127.0.0.1:8765/?check=1` and look for `Demo data checks passed` in the browser console. Run `node --check dashboard.js` and `node --check icons.js` to check JavaScript syntax.

## Deploy on Vercel

Import the GitHub repository, keep the framework preset as **Other**, and deploy the repository root with the default build and output settings. The project requires no install, build command, environment variables, or API.

## Demo flows

- Switch traffic and financial views, and refresh the demo timestamps.
- Search, filter, sort, and paginate the Supply Side and Demand Side tables.
- Inspect an endpoint and open sample Statistics or Loggers context.
- Change visible columns, download a CSV, toggle configured status, and add a sample endpoint in the current session.

Wix Madefor Display is distributed under the included SIL Open Font License.

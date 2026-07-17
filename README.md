# Portfolio

An engineer's portfolio hosted on GitHub Pages with a CMS-style admin panel.

## One-time setup

1. **Edit `js/api.js`** — replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME` with your values.
2. **Create the repo on GitHub** and push all files.
3. **Enable GitHub Pages** — Settings → Pages → Deploy from branch → `main` / root.
4. **Visit the admin panel** at `https://{username}.github.io/{repo}/forge.html`
5. **Default access key:** `changeme123` — change this immediately in the Settings tab.
6. **Enter your GitHub token** when prompted:
   - GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Generate new token → check `repo` scope → copy it (shown once)

## Usage

- All content is managed through the admin panel (`/forge.html`)
- Changes go live within ~30 seconds via GitHub Pages
- Images you upload are stored in `assets/img/` in your repo

## Security

- GitHub token is stored in browser session only — never written to any file
- Access key is stored as a SHA-256 hash in `data/config.json`
- Admin panel is excluded from search engine indexing
- Change the default key immediately after setup

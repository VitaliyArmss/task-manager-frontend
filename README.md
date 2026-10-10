# Task Manager Frontend

React + Vite frontend for GitHub Pages. The API URL is intentionally hard-coded in `src/api.js`; there are no `.env` files in this project.

## Production endpoints

- GitHub repository: `VitaliyArmss/task-manager-frontend`
- GitHub Pages URL: `https://vitaliyarmss.github.io/task-manager-frontend/`
- API URL: `https://api.vitaliy-armss.ru/task-manager/api`

## Publish

1. Upload the contents of this folder to the GitHub repository `task-manager-frontend`, including the hidden `.github/workflows/deploy.yml` file.
2. In GitHub repository settings, open **Settings → Pages** and choose **GitHub Actions** as the source.
3. Push/upload the files to branch `main`. The workflow installs packages, builds Vite, and publishes `dist/`.

For local development run `npm install`, then `npm run dev`.

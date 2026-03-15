<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run locally with a backend proxy

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `OPENAI_API_KEY` in [.env.local](.env.local) to your OpenAI API key
3. Start both the Vite frontend and the Express backend:
   `npm run dev`

The web app runs on `http://localhost:3000`.
The backend proxy runs on `http://localhost:8787`.

## Why this changed

OpenAI is now called only from the server. The browser never receives the API key, which prevents the key from being exposed in built frontend assets or client-side requests.

## Production

This app no longer fits GitHub Pages style static deployment, because OpenAI requests go through the backend.

1. Build the frontend:
   `npm run build`
2. Start the server:
   `npm run start`

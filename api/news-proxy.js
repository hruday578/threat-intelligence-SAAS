// Vercel serverless function: proxies POST requests to NewsAPI.ai
// This is needed because:
// 1. Vercel "rewrites" only forward GET — POST body is silently dropped.
// 2. NewsAPI.ai blocks direct browser fetch (no CORS headers).

// Extend Vercel function timeout (default 10s kills slow NewsAPI responses)
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // Allow CORS from any origin (the Vercel frontend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = { ...req.body };
    if (!body.apiKey) {
      body.apiKey = process.env.NEWSAPI_AI_KEY || process.env.VITE_NEWSAPI_KEY;
    }
    if (!body.apiKey) {
      return res.status(400).json({ error: 'NewsAPI.ai key is missing. Set NEWSAPI_AI_KEY in backend environment.' });
    }

    const response = await fetch('https://eventregistry.org/api/v1/article/getArticles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[news-proxy] Error:', err.message);
    return res.status(502).json({ error: 'News API proxy failed: ' + err.message });
  }
}

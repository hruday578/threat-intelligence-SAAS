// Vercel serverless function: Proxies AI classification requests securely
// Prevents exposing API keys in browser network traffic and handles CORS & throttling

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-ai-provider, x-ai-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { provider, apiKey, model, messages, temperature } = req.body;

    // Determine target API endpoint
    let targetEndpoint = '';
    let targetKey = apiKey || req.headers['x-ai-key'] || process.env.GROQ_API_KEY;

    if (provider === 'openrouter') {
      targetEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
      targetKey = targetKey || process.env.OPENROUTER_API_KEY;
    } else if (provider === 'deepseek') {
      targetEndpoint = 'https://api.deepseek.com/chat/completions';
      targetKey = targetKey || process.env.DEEPSEEK_API_KEY;
    } else {
      // Default to Groq
      targetEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
      targetKey = targetKey || process.env.GROQ_API_KEY;
    }

    if (!targetKey) {
      return res.status(400).json({ error: 'No API key provided for AI provider.' });
    }

    const aiResponse = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${targetKey}`,
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-120b',
        temperature: temperature ?? 0.1,
        messages: messages || [],
      }),
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      const errMsg = data?.error?.message || `AI Provider HTTP ${aiResponse.status}`;
      return res.status(aiResponse.status).json({ error: errMsg, details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('[ai-proxy] Exception:', err.message);
    return res.status(502).json({ error: 'AI proxy execution failed: ' + err.message });
  }
}

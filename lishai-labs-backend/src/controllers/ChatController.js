const pool = require('../config/database');

const chat = async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ message: 'The chatbot is not configured yet.' });
    }

    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Please enter a message.' });
    if (message.length > 2000) return res.status(400).json({ message: 'Please keep your message under 2,000 characters.' });

    const [settingsRows] = await pool.execute('SELECT setting_key, setting_value FROM site_settings');
    const [posts] = await pool.execute("SELECT title, excerpt, content, category FROM posts WHERE status='published' LIMIT 100");
    const [projects] = await pool.execute("SELECT title, summary, description, category, tags FROM projects WHERE status='published' LIMIT 100");
    const [opportunities] = await pool.execute("SELECT title, description, location, type FROM opportunities WHERE status='published' LIMIT 100");
    const [documents] = await pool.execute('SELECT title, content FROM knowledge_documents WHERE is_active=1 LIMIT 20');

    const settings = Object.fromEntries(settingsRows.map((row) => [row.setting_key, row.setting_value]));
    const safeSettings = Object.fromEntries(Object.entries(settings).filter(([key]) => !/(password|secret|credential|token|api[_-]?key)/i.test(key)));
    const knowledge = [
      `Company: ${safeSettings.company_name || 'Lish AI Labs'}`,
      `Tagline: ${safeSettings.tagline || ''}`,
      `Email: ${safeSettings.email || ''}`,
      `Phone: ${safeSettings.phone || ''}`,
      `Company information: ${JSON.stringify(safeSettings)}`,
      `Published posts: ${JSON.stringify(posts)}`,
      `Published projects: ${JSON.stringify(projects)}`,
      `Published opportunities: ${JSON.stringify(opportunities)}`,
      `Company documents: ${JSON.stringify(documents)}`,
    ].join('\n\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Lish AI Labs Website',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are the official Lish AI Labs website assistant. Answer only from the supplied knowledge below. If the answer is not available, say that clearly and offer to help users contact the company. Never reveal admin credentials, passwords, private data, database structure or user information.\n\n${knowledge}`,
          },
          ...((Array.isArray(req.body.history) ? req.body.history : []).slice(-8).filter((item) => item && ['user', 'assistant'].includes(item.role)).map((item) => ({
            role: item.role,
            content: String(item.content || '').slice(0, 2000),
          }))),
          { role: 'user', content: message },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter request failed.');
    res.json({ reply: data.choices?.[0]?.message?.content || 'I could not generate a response.' });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'The assistant is temporarily unavailable.' });
  }
};

module.exports = { chat };

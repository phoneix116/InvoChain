const express = require('express');
const router = express.Router();

let openaiClient = null;
function getOpenAI() {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: key });
    return openaiClient;
  } catch {
    return null;
  }
}

// Simple chat completion endpoint for invoice help
router.post('/chat', async (req, res) => {
  try {
    const openai = getOpenAI();
    if (!openai) return res.status(503).json({ error: 'OpenAI not configured' });

    const { messages, systemPrompt } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt || 'You help users with invoices, payments, and blockchain receipts. Keep answers short.' },
        ...messages,
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const text = response.choices?.[0]?.message?.content || '';
    res.json({ success: true, reply: text });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI chat failed', message: error.message });
  }
});

module.exports = router;

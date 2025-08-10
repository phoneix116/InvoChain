const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const aiAPI = {
  chat: async (messages, systemPrompt) => {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Chat failed');
    }
    return res.json();
  },
};

export default aiAPI;

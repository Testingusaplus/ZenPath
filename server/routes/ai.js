import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../services/db.js';

const router = express.Router();

const mockWellnessCoaching = (message) => {
  const msg = message.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I am your AI Wellness Coach. How are you feeling today? Remember, taking a few deep breaths is always a great way to start your day.";
  }
  
  if (msg.includes('stressed') || msg.includes('anxious') || msg.includes('stress') || msg.includes('anxiety')) {
    return "I hear you, and it's completely okay to feel stressed. Try the 4-7-8 breathing technique right now: Inhale for 4 seconds, hold for 7 seconds, exhale slowly for 8 seconds. Would you like me to help you log this in your journal space?";
  }
  
  if (msg.includes('sad') || msg.includes('depressed') || msg.includes('lonely') || msg.includes('mood')) {
    return "I am sorry to hear you're feeling down. Journaling is a safe space to release these feelings. Try focusing on one small thing you are grateful for today—even if it's just a warm drink or a soft blanket. Every step counts!";
  }

  if (msg.includes('sleep') || msg.includes('tired') || msg.includes('insomnia') || msg.includes('exhausted')) {
    return "Rest is so vital for wellness. To prepare for a good sleep, try dimming your screens 1 hour before bed, and focus on relaxing your shoulders and face. You can also explore our sleep soundscapes in the Shop section!";
  }

  if (msg.includes('habit') || msg.includes('routine') || msg.includes('goal')) {
    return "Building positive habits takes time and consistency, not perfection. Start small: if your goal is hydration, track drinking just 3 cups today instead of jumping directly to 8. Focus on maintaining a streak!";
  }

  return "Thank you for sharing that with me. As your wellness coach, I encourage you to listen to your body today. Remember to log your mood and energy in the Daily Check-In to track your emotional trends over time. Is there anything else you want to talk about?";
};

router.post('/chat', requireAuth, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Chat prompt message is required' });
  }

  const config = db.getConfig();
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    // Return simulated response with minor delay to feel natural
    await new Promise(resolve => setTimeout(resolve, 800));
    return res.json({
      text: mockWellnessCoaching(message),
      isMocked: true
    });
  }

  try {
    // Call Google's Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an empathetic, supportive AI Wellness Coach. Help the user manage stress, reflect on their day, build self-care habits, and track their well-being. Keep answers conversational, helpful, and concise (under 3-4 paragraphs). User prompt: ${message}`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gemini API call failed');
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am sorry, I am having trouble understanding right now. Please try again.';

    res.json({
      text: replyText,
      isMocked: false
    });
  } catch (err) {
    // Log API error to system logs
    db.insert('system_logs', {
      timestamp: new Date().toISOString(),
      action: 'Gemini API Error',
      admin: 'SYSTEM',
      details: err.message,
      type: 'error'
    });

    // Fall back to mock response so the UI doesn't break
    res.json({
      text: `${mockWellnessCoaching(message)} *(Coach API connection error, fell back to local model)*`,
      isMocked: true
    });
  }
});

export default router;

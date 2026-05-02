const { GoogleGenerativeAI } = require('@google/generative-ai');
const OracleChat = require('../models/OracleChat');
const College = require('../models/College');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Oracle, an AI assistant for RateMyCollege India — a platform with real student reviews of Indian engineering colleges (IITs, NITs, IIITs, BITS). You help students make informed decisions about colleges and professors.

Guidelines:
- Use the provided real review data and ratings in your responses
- Be honest — if ratings are low, say so. Don't sugarcoat.
- Keep responses concise and mobile-friendly (bullet points for comparisons)
- When comparing colleges, use the actual rating numbers provided
- Never make up statistics not in the provided data
- If asked about something outside college topics, gently redirect
- Use Indian context — mention JEE, GATE, placement season, hostel life naturally
- Respond in English. Be warm and helpful like a senior student giving advice.`;

// Cache college names for keyword matching
let collegeCache = null;
let collegeCacheTime = null;

const getColleges = async () => {
  const now = Date.now();
  if (collegeCache && collegeCacheTime && (now - collegeCacheTime) < 5 * 60 * 1000) {
    return collegeCache;
  }
  collegeCache = await College.find({}, 'name shortName ratings');
  collegeCacheTime = now;
  return collegeCache;
};

const chat = async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ message: 'Message and sessionId required' });
    }

    // Find or create chat session
    let oracleChat = await OracleChat.findOne({ sessionId });
    if (!oracleChat) {
      oracleChat = new OracleChat({
        sessionId,
        user: req.user?._id || null,
        isGuest: !req.user,
        messages: [],
        messageCount: 0
      });
    }

    // Check message limits
    const limit = req.user ? 50 : 10;
    if (oracleChat.messageCount >= limit) {
      return res.status(429).json({
        message: req.user
          ? 'Message limit reached for this session'
          : 'Message limit reached. Sign in for more messages.'
      });
    }

    // Extract college names from message for context
    const colleges = await getColleges();
    const messageLower = message.toLowerCase();
    const matchedColleges = colleges.filter(c =>
      messageLower.includes(c.name.toLowerCase()) ||
      messageLower.includes(c.shortName.toLowerCase())
    );

    // Build context string
    let contextString = '';
    if (matchedColleges.length > 0) {
      contextString = '\n\nReal data from RateMyCollege India platform:\n';
      matchedColleges.forEach(c => {
        contextString += `\n${c.name} (${c.shortName}):
- Overall: ${c.ratings.overall}/5
- Teaching: ${c.ratings.teaching}/5
- Placements: ${c.ratings.placements}/5
- Research: ${c.ratings.research}/5
- Hostel: ${c.ratings.hostel}/5
- Infrastructure: ${c.ratings.infrastructure}/5
- Faculty Accessibility: ${c.ratings.facultyAccessibility}/5\n`;
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders();

    // Build prompt
    const fullPrompt = `${SYSTEM_PROMPT}${contextString}

Conversation history:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}

User: ${message}
Assistant:`;

    // Call Gemini API with streaming
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContentStream(fullPrompt);

    let fullResponse = '';

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    // Save to database
    oracleChat.messages.push({ role: 'user', content: message });
    oracleChat.messages.push({ role: 'assistant', content: fullResponse });
    oracleChat.messageCount += 1;
    await oracleChat.save();

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Oracle chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Oracle error', error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Something went wrong' })}\n\n`);
      res.end();
    }
  }
};

module.exports = { chat };
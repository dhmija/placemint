const Interview = require('../models/interviewModel');
const logger = require('../config/logger');

// Helper function to clean chat history for Gemini API
// Removes MongoDB _id and other non-essential fields
const cleanChatHistory = (history) => {
  return history.map(item => ({
    role: item.role,
    parts: Array.isArray(item.parts) ? item.parts.map(part => ({
      text: part.text
    })) : item.parts
  }));
};

const extractGeminiText = (result) => {
  return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
};

const isLowEffortAnswer = (answer = '') => {
  const text = answer.trim().toLowerCase();
  if (!text) return true;
  if (text.length < 15) return true;

  const placeholders = new Set(['a', 'ok', 'hmm', 'idk', 'abc', 'bc', 'xyz', 'na']);
  return placeholders.has(text);
};

const buildInterviewSummary = (history = []) => {
  const userAnswers = history
    .filter((item) => item.role === 'user')
    .map((item) => (item.parts?.[0]?.text || '').trim())
    .filter(Boolean);

  if (!userAnswers.length) {
    return {
      score: 20,
      feedback: 'Interview ended before enough responses were provided. Complete more rounds for meaningful assessment.',
    };
  }

  const lowEffortCount = userAnswers.filter(isLowEffortAnswer).length;
  const qualityRatio = 1 - lowEffortCount / userAnswers.length;
  const score = Math.max(35, Math.min(95, Math.round(45 + qualityRatio * 45 + userAnswers.length * 2)));

  let feedback = 'Good participation. Keep adding more depth and concrete examples in your answers.';
  if (lowEffortCount === 0 && userAnswers.length >= 4) {
    feedback = 'Strong interview effort with consistently detailed answers. Continue sharpening clarity and structure for senior-level rounds.';
  } else if (lowEffortCount > 0) {
    feedback = 'Some answers were too brief or generic. Improve by explaining your approach, trade-offs, and implementation details.';
  }

  return { score, feedback };
};

// System instruction for different roles
const getSystemInstruction = (topic, company = 'Google') => {
  const roleDescriptions = {
    'AI Engineer': {
      focus: 'advanced Python, TensorFlow, LLM principles, transformers, neural networks',
      level: 'senior',
    },
    'Machine Learning Engineer': {
      focus: 'ML pipelines, feature engineering, model evaluation, data processing',
      level: 'mid-senior',
    },
    'iOS Developer': {
      focus: 'Swift, UIKit, architecture patterns, performance optimization, iOS APIs',
      level: 'senior',
    },
    'Blockchain Engineer': {
      focus: 'smart contracts, cryptography, consensus mechanisms, Solidity',
      level: 'senior',
    },
  };

  const role = roleDescriptions[topic] || roleDescriptions['AI Engineer'];

  return {
    parts: [
      {
        text: `You are an expert ${role.level} hiring manager at ${company} for the ${topic} role. 
You will conduct a realistic, challenging, and helpful mock interview.

CRITICAL RULES:
1. Always ask only ONE technical question at a time.
2. EVALUATE ANSWER QUALITY STRICTLY:
   - If the answer is too short (< 2 sentences), vague, or contains only placeholder text like "bc", "abc", "xyz", etc., respond with CRITICAL FEEDBACK.
   - Point out specifically what was missing or inadequate.
   - Require a more detailed, substantive answer before moving to the next question.
   - DO NOT give positive feedback for weak answers - this is a serious interview.
3. After receiving a GOOD answer (substantive, detailed, technically correct):
   - Provide 1-2 sentences of brief, constructive feedback highlighting what was done well.
   - Then immediately ask your NEXT technical question.
4. If answer is weak, ask a follow-up like: "Can you elaborate more on that? I need a deeper explanation."
5. Be professional, encouraging but DEMANDING, and highly technical.
6. Focus on: ${role.focus}
7. Ask progressively harder questions as the interview progresses.
8. This is a ${role.level}-level position - expect detailed technical knowledge, not surface-level responses.

Start with an introduction and your first question.`,
      },
    ],
  };
};

// Call Gemini API
const callGeminiAPI = async (chatHistory) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: chatHistory,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error(`Gemini API error: ${JSON.stringify(error)}`);
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    const aiResponse = extractGeminiText(result);
    if (!aiResponse) {
      throw new Error('Gemini API returned empty content');
    }
    return aiResponse;
  } catch (error) {
    logger.error(`Error calling Gemini API: ${error.message}`);
    throw error;
  }
};

// Start a new interview
exports.startInterview = async (req, res) => {
  try {
    let { topic } = req.body;
    // Normalize topic aliases (accept frontend slugs like 'ai-engineer')
    const topicAliases = {
      'ai-engineer': 'AI Engineer',
      'ai_engineer': 'AI Engineer',
      'ai engineer': 'AI Engineer',
      'machine-learning-engineer': 'Machine Learning Engineer',
      'machine_learning_engineer': 'Machine Learning Engineer',
      'machine learning engineer': 'Machine Learning Engineer',
      'ios-developer': 'iOS Developer',
      'ios_developer': 'iOS Developer',
      'ios developer': 'iOS Developer',
      'blockchain-engineer': 'Blockchain Engineer',
      'blockchain_engineer': 'Blockchain Engineer',
      'blockchain engineer': 'Blockchain Engineer',
    };

    if (typeof topic === 'string') {
      const key = topic.trim().toLowerCase();
      if (topicAliases[key]) topic = topicAliases[key];
    }
    logger.info(`Normalized topic: ${topic}`);
    const studentId = req.user?.id || req.body.studentId;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }

    if (!topic) {
      return res.status(400).json({ message: 'Topic required' });
    }

    // Create new interview
    const interview = new Interview({
      studentId,
      topic,
      company: 'Google',
      status: 'ongoing',
      history: [],
    });

    // Get AI's opening message
    const systemInstruction = getSystemInstruction(topic, 'Google');
    const initialChatHistory = [
      {
        role: 'user',
        parts: [{ text: 'Start the interview' }],
      },
    ];

    // Add system instruction to the request
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: cleanChatHistory(initialChatHistory),
      systemInstruction: systemInstruction,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error(`Gemini API error: ${JSON.stringify(error)}`);
      return res.status(500).json({ message: 'Failed to start interview' });
    }

    const result = await response.json();
    const aiMessage = result.candidates[0].content.parts[0].text;

    // Store in history
    interview.history.push({
      role: 'model',
      parts: [{ text: aiMessage }],
    });

    await interview.save();
    logger.info(`Interview started for student ${studentId} with topic ${topic}`);

    res.json({
      interviewId: interview._id,
      message: aiMessage,
      history: interview.history,
    });
  } catch (error) {
    logger.error(`Error starting interview: ${error.message}`);
    res.status(500).json({ message: 'Failed to start interview', error: error.message });
  }
};

// Handle student answer
exports.handleStudentAnswer = async (req, res) => {
  try {
    const { interviewId, answer } = req.body;

    if (!interviewId || !answer) {
      return res.status(400).json({ message: 'Interview ID and answer required' });
    }

    const normalizedAnswer = answer.trim();
    if (isLowEffortAnswer(normalizedAnswer)) {
      return res.status(400).json({
        message: 'Answer is too short. Please provide a clearer technical explanation before continuing.',
      });
    }

    // Fetch interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'ongoing') {
      return res.status(400).json({ message: 'Interview is not ongoing' });
    }

    // Add student's answer to history
    let chatHistory = [...interview.history];
    chatHistory.push({
      role: 'user',
      parts: [{ text: normalizedAnswer }],
    });

    // Get AI response with system instruction
    const systemInstruction = getSystemInstruction(interview.topic, interview.company);
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: cleanChatHistory(chatHistory),
      systemInstruction: systemInstruction,
    };

    logger.info(`Sending to Gemini API: ${JSON.stringify(payload).substring(0, 200)}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error(`Gemini API error: ${JSON.stringify(error)}`);
      return res.status(500).json({ message: 'Failed to get AI response' });
    }

    const result = await response.json();
    const aiResponse = extractGeminiText(result);
    if (!aiResponse) {
      return res.status(500).json({ message: 'Failed to get AI response' });
    }

    // Add AI response to history
    chatHistory.push({
      role: 'model',
      parts: [{ text: aiResponse }],
    });

    // Update interview
    interview.history = chatHistory;
    await interview.save();

    logger.info(`Answer received for interview ${interviewId}`);

    res.json({
      message: aiResponse,
      history: interview.history,
    });
  } catch (error) {
    logger.error(`Error handling student answer: ${error.message}`);
    res.status(500).json({ message: 'Failed to process answer', error: error.message });
  }
};

// End interview
exports.endInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: 'Interview ID required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'completed';
    interview.endTime = new Date();
    interview.duration = Math.round((interview.endTime - interview.startTime) / 1000);
    const summary = buildInterviewSummary(interview.history);
    interview.score = summary.score;
    interview.feedback = summary.feedback;

    await interview.save();
    logger.info(`Interview ${interviewId} completed`);

    res.json({ message: 'Interview ended', interview });
  } catch (error) {
    logger.error(`Error ending interview: ${error.message}`);
    res.status(500).json({ message: 'Failed to end interview', error: error.message });
  }
};

// Get interview history
exports.getInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    logger.error(`Error fetching interview: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch interview', error: error.message });
  }
};

// Get all interviews for a student
exports.getStudentInterviews = async (req, res) => {
  try {
    const studentId = req.user?.id || req.params.studentId;

    const interviews = await Interview.find({ studentId }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    logger.error(`Error fetching student interviews: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch interviews', error: error.message });
  }
};

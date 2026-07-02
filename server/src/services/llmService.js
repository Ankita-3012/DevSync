const Groq = require('groq-sdk');
const { groqApiKey, groqModel } = require('../config/env');

const groq = new Groq({ apiKey: groqApiKey });

const reviewCode = async (code, language = 'javascript') => {
  const prompt = `You are an expert code reviewer. Review the following ${language} code and identify bugs, logic errors, and improvements.

Return ONLY a JSON array with no explanation, no markdown, no backticks — just raw JSON.
Each item must have exactly these fields:
- "line": the line number (integer) where the issue occurs
- "severity": one of "error", "warning", or "suggestion"
- "message": a concise description of the issue

If there are no issues, return an empty array: []

Code to review:
\`\`\`${language}
${code}
\`\`\``;

  const response = await groq.chat.completions.create({
    model: groqModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2, // low temperature = more deterministic, consistent output
    max_tokens: 1000,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '[]';

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item.line === 'number' &&
        typeof item.severity === 'string' &&
        typeof item.message === 'string'
    );
  } catch {
    return [];
  }
};

module.exports = { reviewCode };
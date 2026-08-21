const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');


const googleAI = new GoogleGenAI({}); 
const groqAI = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, 
  baseURL: "https://api.groq.com/openai/v1" 
});

const executeSecurityAnalysis = async (prompt, config = {}) => {
  const { modelType = 'gemini-3.1-flash-lite', temperature = 0.7, maxTokens = 2048 } = config;

  try {
    
    if (modelType.startsWith('gemini')) {
      const response = await googleAI.models.generateContent({
        model: modelType,
        contents: prompt,
        config: { temperature: Number(temperature), maxOutputTokens: Number(maxTokens) }
      });
      return response.text;
    }

    
    const response = await groqAI.chat.completions.create({
      model: modelType,
      messages: [{ role: 'user', content: prompt }],
      temperature: Number(temperature),
      max_tokens: Number(maxTokens),
      response_format: { type: "json_object" }
    });
    return response.choices[0].message.content;
    
  } catch (error) {
    console.error("AI Execution Error:", error);
    throw error;
  }
};

module.exports = { executeSecurityAnalysis };
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, User } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Cache stores
let marketPulseCache: { data: MarketPulse, timestamp: number } | null = null;
const MARKET_PULSE_TTL = 1000 * 60 * 60; // 1 hour

const newsCache: Record<string, { data: string[], timestamp: number }> = {};
const NEWS_TTL = 1000 * 60 * 15; // 15 minutes

const isRecoverableError = (error: any) => {
    const status = error?.status || error?.code || error?.error?.code || error?.error?.status;
    const message = (error?.message || '').toLowerCase();
    
    return (
        status === 429 || 
        status === 403 || 
        message.includes('429') || 
        message.includes('quota') || 
        message.includes('permission') ||
        message.includes('denied')
    );
};

export const analyzePostSentiment = async (content: string) => {
  if (!apiKey) return { sentiment: 'Neutral', risk: 'Medium', summary: 'AI Analysis Unavailable' };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this stock market social post. Provide Sentiment (Bullish/Bearish/Neutral), Risk Level (Low/Medium/High), and a very brief 1-sentence summary.
      Post: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral'] },
            risk: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            summary: { type: Type.STRING },
          },
          required: ['sentiment', 'risk', 'summary'],
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("No response text");
  } catch (error) {
    if (isRecoverableError(error)) {
        console.warn("Gemini API Error (Quota/Permission). Returning fallback sentiment.");
    } else {
        console.error("Gemini Analysis Error:", error);
    }
    // Return safe fallback to prevent app crash
    return { 
        sentiment: 'Neutral', 
        risk: 'Medium', 
        summary: 'AI Analysis unavailable due to high traffic or permission limits.' 
    };
  }
};

export const summarizeChat = async (messages: string[]) => {
  if (!apiKey) return ["API Key missing."];

  try {
    const chatText = messages.join("\n");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize this market discussion chat into 3 concise bullet points for a quick catch-up.
      
      Chat:
      ${chatText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return ["Could not summarize chat."];
  } catch (error) {
    if (isRecoverableError(error)) {
        console.warn("Gemini API Error (Quota/Permission). Chat summary skipped.");
    } else {
        console.error("Gemini Summarize Error:", error);
    }
    return [
        "Chat summary unavailable.",
        "System experiencing high traffic.",
        "Please read recent messages above."
    ];
  }
};

export const getStockNews = async (ticker: string) => {
    // Check Cache
    const now = Date.now();
    if (newsCache[ticker] && (now - newsCache[ticker].timestamp < NEWS_TTL)) {
        return newsCache[ticker].data;
    }

    if (!apiKey) return ["News API key missing."];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 3 recent, short news headlines relevant to the stock ${ticker}.`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        const lines = response.text?.split('\n').filter(l => l.trim().length > 10).slice(0, 3) || [];
        if (lines.length === 0) throw new Error("No news found");
        
        const result = lines.map(l => l.replace(/^[-*•]\s*/, '')); // Remove bullets
        
        // Update Cache
        newsCache[ticker] = { data: result, timestamp: now };
        
        return result;
    } catch (error) {
        if (isRecoverableError(error)) {
             console.warn(`Gemini API Error (News for ${ticker}). Using fallback.`);
        } else {
             console.error("Gemini News Error:", error);
        }
        // Robust fallback
        return [
            `Real-time updates for ${ticker} currently unavailable.`,
            "Please check exchange website for news.",
            "Market data connection limited."
        ];
    }
}

export const moderateContent = async (text: string): Promise<boolean> => {
    if (!apiKey) return true; // Fail open if no key
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Is the following content toxic, spam, or inappropriate for a financial community? Respond with strictly JSON boolean. Content: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSafe: { type: Type.BOOLEAN }
                    }
                }
            }
        });
        const result = JSON.parse(response.text || '{"isSafe": true}');
        return result.isSafe;
    } catch (e) {
        if (!isRecoverableError(e)) {
            console.error("Moderation failed", e);
        }
        return true; // Fail open to not block users during outages
    }
}

export const getChatBotResponse = async (query: string): Promise<string> => {
    if (!apiKey) return "I'm currently offline (No API Key).";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are Gemini, a helpful AI assistant in a stock market community chat called InvestMate. Keep answers concise (max 2 sentences). User asked: "${query}"`
        });
        return response.text || "I couldn't process that.";
    } catch (e) {
        return "I'm receiving too many requests right now. Please try again later.";
    }
}

export interface MarketPulse {
    trends: string;
    sentiment: string;
    newsSummary: string;
    riskLevel: string;
}

export const getMarketPulse = async (): Promise<MarketPulse> => {
    // Check Cache
    const now = Date.now();
    if (marketPulseCache && (now - marketPulseCache.timestamp < MARKET_PULSE_TTL)) {
        return marketPulseCache.data;
    }

    if (!apiKey) return { trends: "N/A", sentiment: "Neutral", newsSummary: "AI unavailable", riskLevel: "Medium" };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a 'Market Pulse' daily digest for Indian Stock Market (Nifty/BankNifty). 
            Provide:
            1. Key Trends (e.g. IT sector rally)
            2. Overall Sentiment (Bullish/Bearish/Neutral)
            3. A one sentence news summary.
            4. Risk Level (Low/Medium/High).
            Strictly filter out any specific buy/sell signals or unverified tips. Keep it educational.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        trends: { type: Type.STRING },
                        sentiment: { type: Type.STRING },
                        newsSummary: { type: Type.STRING },
                        riskLevel: { type: Type.STRING }
                    }
                }
            }
        });
        
        const data = JSON.parse(response.text || '{}');
        
        // Update Cache
        marketPulseCache = { data, timestamp: now };
        
        return data;
    } catch (e) {
        if (isRecoverableError(e)) {
            console.warn("Gemini API Error (Market Pulse). Using fallback.");
        } else {
            console.error("Market Pulse Error", e);
        }
        // Return a realistic fallback object so the UI doesn't break
        return { 
            trends: "Market consolidation observed.", 
            sentiment: "Neutral", 
            newsSummary: "Live AI market updates are temporarily paused due to traffic or permissions.", 
            riskLevel: "Medium" 
        };
    }
}

export const generateQuizQuestion = async (): Promise<QuizQuestion | null> => {
  if (!apiKey) return null;

  try {
    const topics = ["Technical Analysis", "Fundamental Analysis", "Options Trading", "Crypto Basics", "Risk Management"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a multiple-choice question about ${randomTopic} for a stock market app user.
      It should be challenging but educational.
      Return JSON with:
      - question: string
      - options: array of 4 strings
      - correctIndex: number (0-3)
      - explanation: string (why the answer is correct)
      - difficulty: 'Easy', 'Medium', or 'Hard'`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
     if (isRecoverableError(error)) {
        console.warn("Gemini API Error (Quiz). Using fallback.");
    } else {
        console.error("Quiz Gen Error:", error);
    }
    // Fallback question to keep feature working during outages
    return {
         question: "What does RSI stand for in technical analysis?",
         options: ["Relative Strength Index", "Rate of Stock Increase", "Risk Standard Indicator", "Return on Stock Investment"],
         correctIndex: 0,
         explanation: "RSI (Relative Strength Index) is a momentum indicator that measures the magnitude of recent price changes to evaluate overbought or oversold conditions.",
         difficulty: "Easy"
    };
  }
};

export const generateGuruIntroScript = async (user: User): Promise<string> => {
    if (!apiKey) return `Hi, I'm ${user.name}. Join my club on InvestMate for daily insights. Let's grow together!`;

    try {
        const stats = user.guruStats ? `I have a community of ${user.guruStats.totalReach} traders and a ${user.guruStats.retentionRate}% retention rate.` : '';
        const badges = user.badges.join(', ');
        const bio = user.bio;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a high-energy, 15-second intro script for a stock market influencer named ${user.name}. 
            Bio: "${bio}". 
            Stats: "${stats}". 
            Badges: "${badges}".
            The script should be catchy, professional, and encourage people to join their club on InvestMate. Max 40 words.`,
        });

        return response.text || `Welcome to my profile! I'm ${user.name}, ready to help you navigate the markets.`;
    } catch (error) {
        if (isRecoverableError(error)) {
            console.warn("Gemini Script Gen Error. Using fallback.");
        }
        return `Hi, I'm ${user.name}. I'm here to share my market analysis and trade ideas. Follow me for daily updates!`;
    }
};
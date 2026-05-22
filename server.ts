import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Initialize Gemini Client helper
function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured. Go to Settings > Secrets in AI Studio to set your key.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ----------------------------------------------------
// Unified Custom A.I. Model Hub Proxy Helper
// ----------------------------------------------------
async function callAIModel({
  config,
  prompt,
  systemInstruction,
  responseMimeType,
}: {
  config?: {
    provider?: string;
    apiKey?: string;
    model?: string;
    endpoint?: string;
  };
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
}) {
  const provider = config?.provider || "gemini";
  const model = config?.model || "gemini-3.5-flash";
  const apiKey = config?.apiKey || "";

  if (provider === "gemini") {
    const actualApiKey = apiKey.trim() ? apiKey : (process.env.GEMINI_API_KEY || "");
    if (!actualApiKey || actualApiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in environment or custom models hub.");
    }
    const aiClient = new GoogleGenAI({ apiKey: actualApiKey });
    const response = await aiClient.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: responseMimeType as any,
      }
    });
    return response.text || "";
  } else {
    // OpenAI, DeepSeek, OpenRouter, or Custom API compatible endpoints
    let url = "https://api.openai.com/v1/chat/completions";
    let actualKey = apiKey;

    if (provider === "deepseek") {
      url = "https://api.deepseek.com/v1/chat/completions";
    } else if (provider === "openrouter") {
      url = "https://openrouter.ai/api/v1/chat/completions";
    } else if (provider === "custom" && config?.endpoint) {
      url = config.endpoint;
    }

    // Fallback key injection from environment if custom key is empty
    if (!actualKey.trim()) {
      if (provider === "openai") {
        actualKey = process.env.OPENAI_API_KEY || "";
      } else if (provider === "deepseek") {
        actualKey = process.env.DEEPSEEK_API_KEY || "";
      }
    }

    if (!actualKey.trim()) {
      throw new Error(`API Key for provider '${provider}' is missing. Please add it in your Custom Models Configurer.`);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${actualKey}`,
    };

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://ai.studio/build";
      headers["X-Title"] = "ParkNote Studio";
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const body: any = {
      model: model,
      messages: messages,
      temperature: 0.7,
    };

    if (responseMimeType === "application/json") {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`A.I. Hub API returned HTTP ${res.status}: ${errText}`);
    }

    const json: any = await res.json();
    return json?.choices?.[0]?.message?.content || "";
  }
}

// ----------------------------------------------------
// AI Lecture Note Builder Schema & Endpoint
// ----------------------------------------------------
app.post("/api/generate-note", async (req, res) => {
  const { blockContent, subject, config } = req.body;

  if (!blockContent) {
    return res.status(400).json({ error: "No note content provided." });
  }

  try {
    const prompt = `You are ParkNote AI, a world-class cognitive organizer and structured study assistant.
I will give you a raw text note, transcript, meeting minutes, speech dictation, or slide inputs. 
You must analyze this content and transform it into a highly structured, beautiful study and review document.
Create a visually rich, conceptually clear set of notes containing:
1. A scholarly or professional "title" (short, clear, under 6 words).
2. A "category" (use "${subject || "General"}" or determine the appropriate general, creative, business, or academic category).
3. The specific academic or industrial "course" name this topic belongs to (under 4 words).
4. A highly focused study "tag" or topic badge (1-2 words).
5. A descriptive "introduction" synthesizing the raw content in 1-2 sentences.
6. A set of exactly 2 to 4 "summarySections" detailing the core sub-concepts or topics. Each section has a title, short description, and exactly 2 or 3 bullet highlights.
7. A "video" search query mock with details and a real relevant YouTube watch video link.
8. An interactive conceptual diagram specification called "diagram". It must consist of exactly 3 "nodes" representing the key conceptual blocks, stages, or structures involved. Nodes should be placed horizontally or diagonally across coordinates (X from 15 to 85, Y from 25 to 75). Give them descriptive coordinates, tooltips, unique icons, and types. Add 2 connections between these nodes to show the progression, flow, or relationships.
9. A "transcript" text block which MUST BE EXACTLY identical to the provided "User raw input notes" verbatim without edits. Do not rewrite, summarize, sanitize, or change any words in the transcript field so it highlights the exact spoken or pasted text.
10. A "terms" list containing the key vocabulary or jargon words (exactly 2 to 4) mentioned in the transcript, with clear dictionary definitions.

User raw input notes:
"""
${blockContent}
"""
Target Subject / Category Area hint: ${subject || "General"}

IMPORTANT: Respond strictly with a single JSON object. Do NOT wrap it in backticks, markdown, or text.
Use this structures:
{
  "title": "Title here (max 5 words)",
  "category": "e.g. Biology or Tech",
  "course": "e.g. Anatomy",
  "tag": "e.g. Osmosis",
  "introduction": "A concise overview summary.",
  "summarySections": [
    {
      "title": "Subtopic Title",
      "description": "Short explanation",
      "bullets": ["Bullet highlight 1", "Bullet highlight 2"]
    }
  ],
  "video": {
    "title": "Recommended Watch Title",
    "recommendBy": "CrashCourse",
    "description": "Explanatory tag",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  "diagram": {
    "title": "Structure Model",
    "nodes": [
      {"id": "node-1", "name": "PHASE I", "description": "phase brief desc", "type": "primary", "iconName": "activity", "x": 25, "y": 45, "tooltipText": "Step 1"}
    ],
    "connections": [
      {"fromId": "node-1", "toId": "node-2", "label": "transitions"}
    ]
  },
  "transcript": "exactly same verbatim input text",
  "terms": [{"term": "word", "definition": "meaning"}]
}
`;

    const provider = config?.provider || "gemini";
    let textResponse = "";

    if (provider === "gemini") {
      const aiClient = getGemini();
      const response = await aiClient.models.generateContent({
        model: config?.model || "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You generate beautiful, highly educational, accurate study guides, summaries, and structural diagrams in strict JSON format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["title", "category", "course", "tag", "introduction", "summarySections", "video", "diagram", "transcript", "terms"],
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              course: { type: Type.STRING },
              tag: { type: Type.STRING },
              introduction: { type: Type.STRING },
              summarySections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["title", "description", "bullets"],
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              video: {
                type: Type.OBJECT,
                required: ["title", "recommendBy", "description", "url"],
                properties: {
                  title: { type: Type.STRING },
                  recommendBy: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              },
              diagram: {
                type: Type.OBJECT,
                required: ["title", "nodes", "connections"],
                properties: {
                  title: { type: Type.STRING },
                  nodes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["id", "name", "description", "type", "iconName", "x", "y", "tooltipText"],
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING },
                        iconName: { type: Type.STRING },
                        x: { type: Type.INTEGER },
                        y: { type: Type.INTEGER },
                        tooltipText: { type: Type.STRING }
                      }
                    }
                  },
                  connections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["fromId", "toId", "label"],
                      properties: {
                        fromId: { type: Type.STRING },
                        toId: { type: Type.STRING },
                        label: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              transcript: { type: Type.STRING },
              terms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["term", "definition"],
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      textResponse = response.text || "";
    } else {
      textResponse = await callAIModel({
        config,
        prompt,
        systemInstruction: "You are a stellar research notes compiler. You parsed raw lecture text and output gorgeous educational guides in strict JSON format. Respond with raw JSON ONLY. Do not write text outside of JSON structures.",
        responseMimeType: "application/json"
      });
    }

    let cleanJson = textResponse.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedData = JSON.parse(cleanJson || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("AI Compilation Error:", error);
    res.status(500).json({ error: "Could not compile note: " + error.message });
  }
});

// ----------------------------------------------------
// AI Lecture Note Revision Endpoint
// ----------------------------------------------------
app.post("/api/revise-note", async (req, res) => {
  const { existingNote, additionalContent, config } = req.body;

  if (!existingNote || !additionalContent) {
    return res.status(400).json({ error: "Missing existingNote or additionalContent." });
  }

  try {
    const prompt = `You are ParkNote AI, a high-fidelity memory compiler.
You must take an existing, highly structured study document ("existingNote") and integrate new qualitative materials, speech dictations, correction voice memos, or auxiliary files ("additionalContent") into it.

Your goal is to REVISE and ENRICH the study note:
1. Revise the description or introduction if the additional content contradicts or significantly expands the original.
2. Update the "introduction" seamlessly.
3. Update the "summarySections" (merge or add new bullet points/sections where relevant; keep the total between 2 to 4 sections, each with a title, description, and 2-3 bullets).
4. Update the "terms" vocabulary. If the new content introduces new jargon, define it and add it to the lexicon (keep total terms under 6).
5. Seamlessly append the new content to the "transcript" section (e.g. separated by header "// NEW REVISION MEMO //" or similar verbatim verbatim).
6. Adjust the interactive "diagram" nodes/connections if the additional content mentions a new phase, structural component, or state. Ensure the diagram has exactly 3 nodes with coordinate points (X is 15-85, Y is 25-75).

Here is the existing note:
${JSON.stringify(existingNote, null, 2)}

Here is the new auxiliary content/dictation to weave in:
"""
${additionalContent}
"""

IMPORTANT: You must generate the output conforming strictly to the exact LectureNote schema format. Returns JSON ONLY (do not wrap in text or codeblocks):
{
  "id": "${existingNote.id}",
  "title": "...",
  "category": "...",
  "course": "...",
  "tag": "...",
  "introduction": "...",
  "summarySections": [{"title": "...", "description": "...", "bullets": ["..."]}],
  "video": {"title": "...", "recommendBy": "...", "description": "...", "url": "..."},
  "diagram": {
    "title": "...",
    "nodes": [{"id": "...", "name": "...", "description": "...", "type": "...", "iconName": "...", "x": 0, "y": 0, "tooltipText": "..."}],
    "connections": [{"fromId": "...", "toId": "...", "label": "..."}]
  },
  "transcript": "...",
  "terms": [{"term": "...", "definition": "..."}]
}
`;

    const provider = config?.provider || "gemini";
    let textResponse = "";

    if (provider === "gemini") {
      const aiClient = getGemini();
      const response = await aiClient.models.generateContent({
        model: config?.model || "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional research study editor. You refine and merge study guides, notes, visual graphs, and terminology into perfect, cohesive JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["id", "title", "category", "course", "tag", "introduction", "summarySections", "video", "diagram", "transcript", "terms"],
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              course: { type: Type.STRING },
              tag: { type: Type.STRING },
              introduction: { type: Type.STRING },
              summarySections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["title", "description", "bullets"],
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  }
                }
              },
              video: {
                type: Type.OBJECT,
                required: ["title", "recommendBy", "description"],
                properties: {
                  title: { type: Type.STRING },
                  recommendBy: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              },
              diagram: {
                type: Type.OBJECT,
                required: ["title", "nodes", "connections"],
                properties: {
                  title: { type: Type.STRING },
                  nodes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["id", "name", "description", "type", "iconName", "x", "y", "tooltipText"],
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING },
                        iconName: { type: Type.STRING },
                        x: { type: Type.INTEGER },
                        y: { type: Type.INTEGER },
                        tooltipText: { type: Type.STRING }
                      }
                    }
                  },
                  connections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["fromId", "toId", "label"],
                      properties: {
                        fromId: { type: Type.STRING },
                        toId: { type: Type.STRING },
                        label: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              transcript: { type: Type.STRING },
              terms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["term", "definition"],
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      textResponse = response.text || "";
    } else {
      textResponse = await callAIModel({
        config,
        prompt,
        systemInstruction: "You are a professional research study editor. Refine and append dynamic dictation details and save as a single perfect JSON Study Guide.",
        responseMimeType: "application/json"
      });
    }

    let cleanJson = textResponse.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedRevision = JSON.parse(cleanJson || "{}");
    // Preserve core note identity metadata
    parsedRevision.id = existingNote.id;
    res.json(parsedRevision);
  } catch (error: any) {
    console.error("AI Note Revision Error:", error);
    res.status(500).json({ error: "Could not revise note: " + error.message });
  }
});

// ----------------------------------------------------
// AI Chat Spark Study Buddy Endpoint
// ----------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages, activeNoteContext, config } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid chat history." });
  }

  try {
    const noteContextDetails = activeNoteContext
      ? `Active Note Subject: ${activeNoteContext.category}
Active Note Title: ${activeNoteContext.title}
Active Note Summary Overview: ${activeNoteContext.introduction}
Key Vocabulary/Concepts Definitions:
${activeNoteContext.terms?.map((t: any) => `- ${t.term}: ${t.definition}`).join("\n")}
Transcript:
${activeNoteContext.transcript}`
      : "No specific note context has been selected/loaded currently. Help the user generally with cognitive assistance, summaries, ideas, or studies.";

    const systemPrompt = `You are ParkNote AI, a passionate, highly encouraging personal cognitive coach, study companion, and task organizer.
You help a user study active notes, prepare for exams, summarize documents, or review subjects.
Use the active note context provided below to answer user queries.
Ground answers clearly and make explanations bite-sized using concise bullet points for clean structure.
Encourage active recall and learning! Provide a helpful answer, and end your model response with a short, thought-provoking trivia, vocabulary quiz, or active-recall review question.

ACTIVE NOTE CONTEXT:
"""
${noteContextDetails}
"""
`;

    // Package last prompt
    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const conversationHistory = messages.slice(0, -1).map((m: any) => `${m.role === "user" ? "Student" : "Coach"}: ${m.text}`).join("\n");
    
    const finalPrompt = `Conversation History:
${conversationHistory}

Student: ${lastUserMessage}

Please formulate a helpful study response supporting interactive learning.`;

    const reply = await callAIModel({
      config,
      prompt: finalPrompt,
      systemInstruction: systemPrompt,
    });

    res.json({ reply: reply || "I apologize, I was unable to formulate a response. Let me know if you would like to clarify your prompt!" });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "AI assistant couldn't connect: " + error.message });
  }
});

// ----------------------------------------------------
// AI Explain Vocabulary/Phrase Endpoint
// ----------------------------------------------------
app.post("/api/explain-phrase", async (req, res) => {
  const { phrase, noteContextDetail, config } = req.body;

  if (!phrase) {
    return res.status(400).json({ error: "No phrase to explain was provided." });
  }

  try {
    const prompt = `You are ParkNote AI, an specialized academic definitions assistant.
Please explain this specific highlighted vocabulary phrase: "${phrase}"

We are studying in the context of:
"""
${noteContextDetail || "General scientific / conceptual study"}
"""

Provide a concise, 2-to-3 sentence explanation suitable for a textbook terms drawer. Be highly accurate, descriptive, educational, and engaging!`;

    const explanation = await callAIModel({
      config,
      prompt,
      systemInstruction: "You are a friendly and clear lecture terms explainer. Describe concepts clearly in 2-3 sentences.",
    });

    res.json({ explanation: explanation.trim() });
  } catch (error: any) {
    console.error("AI Explain Phrase Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// AI Diagram Image Model Generator (using Imagen, OpenAI DALL-E, fallback)
// ----------------------------------------------------
app.post("/api/generate-diagram-image", async (req, res) => {
  const { noteTitle, noteCategory, config } = req.body;

  if (!noteTitle) {
    return res.status(400).json({ error: "Missing noteTitle." });
  }

  try {
    const provider = config?.provider || "gemini";
    const model = config?.model || "gemini-3.1-flash-image-preview";
    const apiKey = config?.apiKey || "";

    const prompt = `A highly detailed scientific, medical or technical diagram model for '${noteTitle}' (${noteCategory}). It must be structured with visual stages, arrows, schematic definitions and glowing dark slate accents. High fidelity educational illustration, textbook schematic format, clear lines, high resolution, black background.`;

    if (provider === "gemini") {
      const aiClient = getGemini();
      
      if (model.startsWith("imagen")) {
        const response = await aiClient.models.generateImages({
          model: model,
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
        });
        const base64EncodeString = response.generatedImages[0].image.imageBytes;
        return res.json({ imageUrl: `data:image/jpeg;base64,${base64EncodeString}` });
      } else {
        const response = await aiClient.models.generateContent({
          model: model || 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
              imageSize: "1K"
            }
          }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return res.json({ imageUrl: `data:image/jpeg;base64,${part.inlineData.data}` });
          }
        }
      }
    } else if (provider === "openai" || provider === "deepseek" || provider === "custom" || provider === "openrouter") {
      let actualKey = apiKey.trim();
      if (!actualKey) {
        if (provider === "openai") actualKey = process.env.OPENAI_API_KEY || "";
        else if (provider === "deepseek") actualKey = process.env.DEEPSEEK_API_KEY || "";
      }

      if (actualKey) {
        const dBody = {
          model: model || "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024" // optimized card size
        };
        const endpoint = (config?.endpoint && config?.endpoint.trim() !== "") ? config.endpoint : "https://api.openai.com/v1/images/generations";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
             "Content-Type": "application/json",
             "Authorization": `Bearer ${actualKey}`
          },
          body: JSON.stringify(dBody)
        });
        if (response.ok) {
          const json: any = await response.json();
          const imgUrl = json?.data?.[0]?.url;
          if (imgUrl) {
            return res.json({ imageUrl: imgUrl });
          }
        } else {
           const errText = await response.text();
           console.warn("Image API returned an error:", errText);
           return res.status(response.status).json({ error: `Image API Error: ${errText}` });
        }
      } else {
         return res.status(400).json({ error: "Missing API Key for Custom Image Provider." });
      }
    }

    // Default Fallback: Extremely gorgeous vector technical drawing schematic
    const cleanTitle = noteTitle.replace(/['"<>&]/g, "");
    const cleanCategory = noteCategory ? noteCategory.replace(/['"<>&]/g, "") : "General";
    const cleanModel = model ? model.replace(/['"<>&]/g, "") : "imagen-3";

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%" style="background:#0E0D10; font-family:'Space Grotesk', sans-serif;">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D0BCFF" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#A1F000" stop-opacity="0.9"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect width="800" height="500" fill="#0E0D10"/>
      <g stroke="#ffffff" stroke-opacity="0.03" stroke-width="1">
        <path d="M 0,50 L 800,50 M 0,100 L 800,100 M 0,150 L 800,150 M 0,200 L 800,200 M 0,250 L 800,250 M 0,300 L 800,300 M 0,350 L 800,350 M 0,400 L 800,400 M 0,450 L 800,450"/>
        <path d="M 100,0 L 100,500 M 200,0 L 200,500 M 300,0 L 300,500 M 400,0 L 400,500 M 500,0 L 500,500 M 600,0 L 600,500 M 700,0 L 700,500"/>
      </g>
      
      <circle cx="400" cy="250" r="140" fill="none" stroke="url(#g1)" stroke-width="2" stroke-opacity="0.25" stroke-dasharray="10, 15"/>
      <circle cx="400" cy="250" r="180" fill="none" stroke="#D0BCFF" stroke-width="1.5" stroke-opacity="0.1" stroke-dasharray="6, 8"/>

      <circle cx="400" cy="250" r="45" fill="#1D1B20" stroke="url(#g1)" stroke-width="3" filter="url(#glow)"/>
      <text x="400" y="253" text-anchor="middle" fill="#D0BCFF" font-size="12" font-weight="bold" letter-spacing="2">CORE</text>

      <g>
        <line x1="400" y1="250" x2="250" y2="160" stroke="#D0BCFF" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="4, 4"/>
        <circle cx="250" cy="160" r="30" fill="#1D1B20" stroke="#D0BCFF" stroke-width="2"/>
        <text x="250" y="164" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">STAGE I</text>
      </g>
      
      <g>
        <line x1="400" y1="250" x2="550" y2="160" stroke="#D0BCFF" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="4, 4"/>
        <circle cx="550" cy="160" r="30" fill="#1D1B20" stroke="#A1F000" stroke-width="2"/>
        <text x="550" y="164" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">STAGE II</text>
      </g>
      
      <g>
        <line x1="400" y1="250" x2="400" y2="380" stroke="#D0BCFF" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="4, 4"/>
        <circle cx="400" cy="380" r="30" fill="#1D1B20" stroke="#D0BCFF" stroke-width="2"/>
        <text x="400" y="384" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">SYNTHESIS</text>
      </g>

      <text x="50" y="80" fill="#FFFFFF" font-size="24" font-weight="bold" letter-spacing="-0.5">${cleanTitle.toUpperCase()}</text>
      <text x="50" y="105" fill="#A1F000" font-size="11" font-weight="bold" letter-spacing="3">${cleanCategory.toUpperCase()} GENERATED DIAGRAM</text>
      
      <rect x="500" y="350" width="250" height="110" rx="14" fill="#1D1B20" fill-opacity="0.9" stroke="#49454F" stroke-opacity="0.4" stroke-width="1"/>
      <text x="520" y="375" fill="#CAC4D0" font-size="10" font-weight="bold" letter-spacing="1">HUB SPECS</text>
      <circle cx="525" cy="400" r="3.5" fill="#A1F000"/>
      <text x="535" y="403" fill="#E6E1E5" font-size="10">Model: ${cleanModel}</text>
      
      <circle cx="525" cy="425" r="3.5" fill="#D0BCFF"/>
      <text x="535" y="428" fill="#E6E1E5" font-size="10">Status: Active Model Ready</text>
    </svg>`;

    const fallbackSvgUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
    res.json({ imageUrl: fallbackSvgUrl });
  } catch (error: any) {
    console.error("Image Generator Error:", error);
    let errMsg = error.message;
    if (typeof errMsg === 'string' && (errMsg.includes('429') || errMsg.includes('Quota exceeded'))) {
      errMsg = "Gemini API Quota Exceeded. Please try again later, or configure a custom API key from a different provider in the AI Hub.";
    } else if (typeof errMsg === 'string' && errMsg.includes('{"error"')) {
      try {
        const parsed = JSON.parse(errMsg.substring(errMsg.indexOf('{')));
        if (parsed?.error?.message) {
            errMsg = parsed.error.message;
        }
      } catch (e) {}
    }
    res.status(500).json({ error: errMsg });
  }
});

// ----------------------------------------------------
// Express Vite Middleware & SPA serving
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ParkNote Engine running on http://localhost:${PORT}`);
  });
}

startServer();

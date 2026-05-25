# AuraNote 

AuraNote is an AI-powered study notes studio: record audio or paste text and it generates structured notes, terms, visual diagrams, and video recommendations. Notes live in a library, can be revised, exported, and reviewed with the AI "study buddy" chat.

## Key features
- AI notes from audio or text (title, category, sections, terms).
- Interactive diagram and optional AI visual.
- AI note revision (audio, text, file additions).
- "Study Buddy" chat: contextual Q&A and active recall.
- Library: search, category filter, and restore defaults.
- Markdown/HTML export.
- Workspace and profile customization (palette, avatar).
- Admin panel (local account management).
- Google sign-in (Firebase Auth).

## Tech stack
React 19 + Vite, TypeScript, Express API, @google/genai (Gemini), Firebase Auth, Tailwind CSS, Lucide Icons.

## Setup
1. Install Node.js (LTS).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` and add your API key:
   ```bash
   GEMINI_API_KEY=your_key
   # Optional:
   OPENAI_API_KEY=your_key
   DEEPSEEK_API_KEY=your_key
   OPENROUTER_API_KEY=your_key
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'
   # Optional for local-only dev:
   ALLOW_UNAUTHENTICATED_DEV=true
   # Optional host override (default 127.0.0.1):
   HOST=0.0.0.0
   ```
4. For Google sign-in, update `firebase-applet-config.json` with your Firebase project details (optional).
   - API routes require Firebase ID tokens. Provide `FIREBASE_SERVICE_ACCOUNT_JSON` for the server or set `ALLOW_UNAUTHENTICATED_DEV=true` for local-only testing.
5. Start the dev server:
   ```bash
   npm run dev
   ```
   App: http://localhost:3000
                                                                                                                                                                                                                                            
## Scripts                                                                                                                                                                                                                                  
| Command | Description |                                                                                                                                                                                                                   
| --- | --- |                                                                                                                                                                                                                               
| `npm run dev` | Dev server (Vite + Express API) |                                                                                                                                                                                         
| `npm run build` | Frontend build + server bundle |                                                                                                                                                                                        
| `npm run start` | Production server (dist) |                                                                                                                                                                                              
| `npm run lint` | TypeScript type-check |                                                                                                                                                                                                  
| `npm run clean` | Cleans `dist` and `server.js` |                                                                                                                                                                                         
                                                                                                                                                                                                                                            

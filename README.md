# AuraNote (ParkNote Studio)

AuraNote AI-dəkli dərs qeydləri studiyasıdır: səs yazısı və ya mətn daxil edirsən, sistem strukturlaşdırılmış konspekt, terminlər, vizual diaqram və video tövsiyəsi yaradır. Qeydlər kitabxanada saxlanır, yenilənir, export edilir və AI “study buddy” chat ilə təkrar etmək olur.

## Əsas funksiyalar
- Səs yazısı və ya mətnlə AI konspekt yaratma (başlıq, kateqoriya, bölmələr, terminlər).
- İnteraktiv diaqram və opsional AI vizualı.
- Qeydin AI ilə reviziyası (səs, mətn, fayl əlavələri).
- “Study Buddy” chat: kontekstə əsaslanan sual-cavab və aktiv xatırlatma.
- Kitabxana: axtarış, kateqoriya filtri və qeyd bərpası.
- Markdown/HTML export.
- Workspace və profil fərdiləşdirmə (palet, avatar).
- Admin panel (lokal hesabların idarəsi).
- Google sign-in (Firebase Auth).

## Texnologiyalar
React 19 + Vite, TypeScript, Express API, @google/genai (Gemini), Firebase Auth, Tailwind CSS, Lucide Icons.

## Quraşdırma
1. Node.js (LTS) qurun.
2. Asılılıqları yükləyin:
   ```bash
   npm install
   ```
3. `.env.local` yaradın və API açarını əlavə edin:
   ```bash
   GEMINI_API_KEY=your_key
   # Opsional:
   OPENAI_API_KEY=your_key
   DEEPSEEK_API_KEY=your_key
   ```
4. Google giriş üçün `firebase-applet-config.json` faylını öz Firebase layihənizin məlumatları ilə yeniləyin (istəmirsinizsə, bu addımı buraxa bilərsiniz).
5. Dev serveri başladın:
   ```bash
   npm run dev
   ```
   App: http://localhost:3000

## Skriptlər
| Komanda | Təsvir |
| --- | --- |
| `npm run dev` | Dev server (Vite + Express API) |
| `npm run build` | Frontend build + server bundle |
| `npm run start` | Production server (dist) |
| `npm run lint` | TypeScript type-check |
| `npm run clean` | `dist` və `server.js` təmizlənir |

## Demo hesablar
- `aylan@macabalitao.com` / 
- `admin@parknote.com` / 


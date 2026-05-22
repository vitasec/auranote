import React, { useState } from "react";
import { UserAccount } from "../types";
import { Eye, EyeOff, LogIn, UserPlus, ShieldAlert, Award, ArrowRight } from "lucide-react";
import ParkNoteLogo from "./ParkNoteLogo";
import { signInWithGoogle } from "../lib/firebase";

interface SignInViewProps {
  onSignInSuccess: (user: UserAccount) => void;
  accounts: UserAccount[];
  onRegisterAccount: (newAccount: UserAccount) => void;
}

export default function SignInView({
  onSignInSuccess,
  accounts,
  onRegisterAccount
}: SignInViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Avatar Style Choices
  const styles = ["miniavs", "bottts", "avataaars", "thumbs", "lorelei"];
  const [chosenStyle, setChosenStyle] = useState("miniavs");
  const [seedName, setSeedName] = useState("Aylan");

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const user = await signInWithGoogle();
      
      let found = accounts.find(acc => acc.id === user.uid || acc.email.toLowerCase() === user.email?.toLowerCase());
      
      if (!found) {
        // Automatically create account for new Google user
        const newAcc: UserAccount = {
          id: user.uid,
          email: user.email || "",
          fullName: user.displayName || "Google Scholar",
          passwordHash: "google_oauth",
          role: user.email?.includes("admin") ? "admin" : "user",
          avatarStyle: chosenStyle,
          avatarSeed: user.displayName || "Scholar",
          createdAt: new Date().toISOString(),
          status: "active",
          notesCount: 0
        };
        onRegisterAccount(newAcc);
        found = newAcc;
      }
      
      setSuccessMsg(`Welcome, ${found.fullName}! Preparing workspace...`);
      setTimeout(() => {
        onSignInSuccess(found!);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with Google.");
    }
  };

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password;
    const targetFullName = fullName.trim();

    if (!targetEmail || !targetPassword) {
      setErrorMsg("Email and password fields are required.");
      return;
    }

    if (isSignUp) {
      if (!targetFullName) {
        setErrorMsg("Full name is required for registration.");
        return;
      }

      // Check duplicate
      const exists = accounts.some(acc => acc.email.toLowerCase() === targetEmail);
      if (exists) {
        setErrorMsg("An account with this email address already exists.");
        return;
      }

      // Register new user
      const newAcc: UserAccount = {
        id: "usr_" + Math.random().toString(36).substring(2, 11),
        email: targetEmail,
        fullName: targetFullName,
        passwordHash: targetPassword, // Stored clearly for local validation
        role: targetEmail.includes("admin") ? "admin" : "user",
        avatarStyle: chosenStyle,
        avatarSeed: seedName || "Alex",
        createdAt: new Date().toISOString(),
        status: "active",
        notesCount: 0
      };

      onRegisterAccount(newAcc);
      setSuccessMsg("Account registered successfully! Signing in...");
      setTimeout(() => {
        onSignInSuccess(newAcc);
      }, 1000);

    } else {
      // Sign In Flow
      const found = accounts.find(acc => acc.email.toLowerCase() === targetEmail);
      if (!found) {
        setErrorMsg("Account not found. Try one of our pre-seeded accounts below!");
        return;
      }

      if (found.passwordHash !== targetPassword) {
        setErrorMsg("Incorrect password. Please verify your credentials.");
        return;
      }

      if (found.status === "suspended") {
        setErrorMsg("This user account has been suspended by an Admin. Please contact support.");
        return;
      }

      setSuccessMsg(`Welcome back, ${found.fullName}! Preparing workspace...`);
      setTimeout(() => {
        onSignInSuccess(found);
      }, 1000);
    }
  };

  const handlePrepopulate = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setIsSignUp(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div id="signin-root-wrapper" className="min-h-screen bg-[#121214] flex flex-col justify-center items-center p-4 relative font-sans text-[#E6E1E5]">
      {/* Absolute abstract visual glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#D0BCFF]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#A1F000]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#1D1B20] border border-[#49454F]/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden z-10 transition-all duration-300">
        
        {/* Dynamic header */}
        <div className="text-center space-y-1.5 select-none">
          <ParkNoteLogo layout="stacked" className="mx-auto mb-1" />
          <h1 className="text-[21px] font-extrabold tracking-tight text-white uppercase text-center font-sans">
            {isSignUp ? "Create Scholar Account" : "Access your Studio"}
          </h1>
          <p className="text-[#CAC4D0] text-xs max-w-xs mx-auto">
            {isSignUp ? "Configure a profile, avatar type, and key codes for IMAT prep notes" : "Sign in to compile schematics, transcribe lecture audios & build active recall"}
          </p>
        </div>

        {/* Action Toggle Tabs */}
        <div className="grid grid-cols-2 bg-[#121214] p-1 rounded-2xl border border-[#49454F]/20">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center ${
              !isSignUp ? "bg-[#D0BCFF] text-[#21005D]" : "text-[#CAC4D0] hover:bg-white/5"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center ${
              isSignUp ? "bg-[#D0BCFF] text-[#21005D]" : "text-[#CAC4D0] hover:bg-white/5"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Register
            </span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/25 border border-red-900/55 rounded-xl text-[11px] text-red-300 font-sans flex items-start gap-2 animate-fade-in">
            <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/25 border border-emerald-900/55 rounded-xl text-[11px] text-emerald-300 font-sans flex items-start gap-2 animate-pulse">
            <Award className="h-4.5 w-4.5 text-[#A1F000] shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Core Auth Form */}
        <form onSubmit={handleAuthAction} className="space-y-4">
          
          {/* Full Name field for Sign Up */}
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[#938F99] block font-semibold">Full Name / Display Title:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aylan Macabalitao"
                className="w-full h-11 px-4 rounded-xl bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs font-medium text-white placeholder-zinc-600 font-sans"
              />
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-[#938F99] block font-semibold">Email Account:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@domain.com"
              className="w-full h-11 px-4 rounded-xl bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs font-medium text-white placeholder-zinc-600 font-sans"
            />
          </div>

          {/* Password with View Overlay */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-[#938F99] block font-semibold">Password Code:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-4 pr-11 rounded-xl bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs font-mono text-white placeholder-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Style Customizer for Avatar in sign up */}
          {isSignUp && (
            <div className="p-3 bg-[#121214] rounded-2xl border border-[#49454F]/35 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Select Avatar Style &amp; Seed:</span>
              
              <div className="grid grid-cols-5 gap-1">
                {styles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setChosenStyle(style)}
                    className={`py-1 rounded-lg text-[9px] font-bold uppercase text-center border transition cursor-pointer ${
                      chosenStyle === style
                        ? "bg-[#A1F000]/10 border-[#A1F000] text-[#A1F000]"
                        : "bg-[#1D1B20] border-[#49454F]/20 text-[#CAC4D0]"
                    }`}
                  >
                    {style.substring(0, 4)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="text"
                  value={seedName}
                  onChange={(e) => setSeedName(e.target.value)}
                  placeholder="Avatar seed..."
                  className="flex-1 h-8 px-2.5 rounded-lg bg-[#1D1B20] border border-[#49454F]/40 text-xs text-white"
                />
                
                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D0BCFF]/30 shrink-0 bg-[#211F26]">
                  <img
                    alt="Preview"
                    src={`https://api.dicebear.com/9.x/${chosenStyle}/svg?seed=${seedName || "Aylan"}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#A1F000] hover:bg-[#b0ff1a] text-black font-extrabold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {isSignUp ? (
              <>
                <UserPlus className="h-4 w-4 stroke-[2.5]" />
                <span>Register &amp; Launch Studio</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 stroke-[2.5]" />
                <span>Gain Studio Access</span>
              </>
            )}
          </button>
        </form>

        {/* Google Sign In Divider */}
        <div className="flex items-center gap-3 pt-2">
          <hr className="flex-1 border-[#49454F] border-t" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">OR</span>
          <hr className="flex-1 border-[#49454F] border-t" />
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full h-11 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider transition-all duration-150 hover:bg-zinc-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.11c-.22-.69-.35-1.43-.35-2.11s.13-1.42.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Pre-Seeded Quick Access Demo Accounts Card */}
        <div className="pt-4 border-t border-[#49454F]/30 space-y-2.5 select-none font-sans">
          <p className="text-[9px] uppercase tracking-widest text-[#938F99] text-center font-bold">Quick Demo Accounts Preview:</p>
          
          <div className="space-y-2">
            
            <button
              onClick={() => handlePrepopulate("aylan@macabalitao.com", "aylan")}
              className="w-full bg-[#121214] hover:bg-white/5 border border-[#49454F]/30 p-2 text-left rounded-xl flex items-center justify-between text-xs transition group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-[#211F26]">
                  <img src="https://api.dicebear.com/9.x/miniavs/svg?seed=Aylan" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-white leading-tight">Student: Aylan Macabalitao</h4>
                  <p className="text-[9px] text-[#938F99] leading-none">aylan@macabalitao.com • aylan</p>
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-[#D0BCFF] opacity-0 group-hover:opacity-100 transition duration-150" />
            </button>

            <button
              onClick={() => handlePrepopulate("admin@parknote.com", "admin123")}
              className="w-full bg-[#121214] hover:bg-white/5 border border-[#49454F]/30 p-2 text-left rounded-xl flex items-center justify-between text-xs transition group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-[#211F26]">
                  <img src="https://api.dicebear.com/9.x/bottts/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-white leading-tight flex items-center gap-1">
                    <span>Admin: A.I. DB Administrator</span>
                    <span className="text-[8px] bg-red-950 text-red-400 px-1 border border-red-900 rounded-sm font-bold uppercase">DB Admin</span>
                  </h4>
                  <p className="text-[9px] text-[#938F99] leading-none">admin@parknote.com • admin123</p>
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-[#D0BCFF] opacity-0 group-hover:opacity-100 transition duration-150" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

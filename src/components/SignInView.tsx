import { useState } from "react";
import { UserAccount } from "../types";
import { LogIn, ShieldAlert, Award } from "lucide-react";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const user = await signInWithGoogle();

      let found = accounts.find(acc => acc.id === user.uid || acc.email.toLowerCase() === user.email?.toLowerCase());
      if (!found) {
        const newAcc: UserAccount = {
          id: user.uid,
          email: user.email || "",
          fullName: user.displayName || "Google Scholar",
          role: "user",
          avatarStyle: "miniavs",
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
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with Google.");
    }
  };

  return (
    <div id="signin-root-wrapper" className="min-h-screen bg-[#121214] flex flex-col justify-center items-center p-4 relative font-sans text-[#E6E1E5]">
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#D0BCFF]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#A1F000]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#1D1B20] border border-[#49454F]/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden z-10 transition-all duration-300">
        <div className="text-center space-y-1.5 select-none">
          <ParkNoteLogo layout="stacked" className="mx-auto mb-1" />
          <h1 className="text-[21px] font-extrabold tracking-tight text-white uppercase text-center font-sans">
            Access your Studio
          </h1>
          <p className="text-[#CAC4D0] text-xs max-w-xs mx-auto">
            Secure sign-in uses Firebase Authentication. Continue with Google to load your workspace.
          </p>
        </div>

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

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3 rounded-2xl bg-[#D0BCFF] text-[#21005D] font-bold uppercase text-xs tracking-wider hover:bg-[#EADDFF] transition flex items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

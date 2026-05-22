import React, { useState, useEffect } from "react";
import { LectureNote } from "../types";
import { COLOR_PALETTES, ColorPalette } from "../App";
import { generatePaletteFromSeed } from "../utils/paletteUtils";
import ScribbleEmblem from "./ScribbleEmblem";
import { 
  User, Award, CheckCircle2, Circle, Trophy, BarChart2, 
  Calendar, Target, Sparkles, Shuffle, Plus, Trash2, Link2, ChevronRight, HelpCircle, Palette
} from "lucide-react";

interface ProfileViewProps {
  notes: LectureNote[];
  avatarStyle: string;
  avatarSeed: string;
  onChangeAvatarStyle: (style: string) => void;
  onChangeAvatarSeed: (seed: string) => void;
  profileName: string;
  onChangeProfileName: (name: string) => void;
  profileEmail?: string;
  onChangeProfileEmail?: (email: string) => void;
  profileBio?: string;
  onChangeProfileBio?: (bio: string) => void;
  userPassword?: string;
  activePalette?: string;
  onChangePalette?: (id: string) => void;
}

interface StudyGoal {
  id: string;
  text: string;
  done: boolean;
  linkedNoteId?: string;
  linkedNoteTitle?: string;
  targetBenchmark?: string;
}

export interface ModelHubRole {
  provider: string;
  model: string;
  apiKey: string;
  endpoint?: string;
}

export interface ModelHubConfig {
  compiler: ModelHubRole;
  reviser: ModelHubRole;
  chat: ModelHubRole;
  explainer: ModelHubRole;
  diagram: ModelHubRole;
}

export const DEFAULT_HUB_CONFIG: ModelHubConfig = {
  compiler: { provider: "gemini", model: "gemini-3.5-flash", apiKey: "" },
  reviser: { provider: "gemini", model: "gemini-3.5-flash", apiKey: "" },
  chat: { provider: "gemini", model: "gemini-3.5-flash", apiKey: "" },
  explainer: { provider: "gemini", model: "gemini-3.5-flash", apiKey: "" },
  diagram: { provider: "gemini", model: "gemini-3.1-flash-image-preview", apiKey: "" }
};

const AVATAR_STYLES = [
  { value: "miniavs", label: "Miniavs" },
  { value: "bottts", label: "Robots" },
  { value: "pixel-art", label: "8-Bit Pixel" },
  { value: "lorelei", label: "Lorelei Anime" },
  { value: "avataaars", label: "Avatar Avs" },
  { value: "adventurer", label: "Adventurer" },
  { value: "micah", label: "Micah Sketch" },
  { value: "open-peeps", label: "Peeps Sketch" },
];

export default function ProfileView({
  notes = [],
  avatarStyle,
  avatarSeed,
  onChangeAvatarStyle,
  onChangeAvatarSeed,
  profileName,
  onChangeProfileName,
  profileEmail,
  onChangeProfileEmail,
  profileBio,
  onChangeProfileBio,
  userPassword,
  activePalette = "classic-purple",
  onChangePalette,
}: ProfileViewProps) {
  
  // Custom persist goals state helper
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [customBenchmark, setCustomBenchmark] = useState("Before Friday");

  // Load goals from local storage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem("parknote_study_goals_v2");
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {
        setGoals(defaultGoalsList);
      }
    } else {
      setGoals(defaultGoalsList);
    }
  }, []);

  const defaultGoalsList: StudyGoal[] = [
    { id: "1", text: "Listen & transcribe Anatomy Part 2 slide deck", done: true, targetBenchmark: "Before Tomorrow" },
    { id: "2", text: "Review Nephron Bowman's filtration gradients", done: true, linkedNoteId: "neat-nephron-organ", linkedNoteTitle: "Physiology of Nephrons", targetBenchmark: "Before Friday" },
    { id: "3", text: "Ask AI Buddy to quiz me on Bohr Effect dissociation", done: false, targetBenchmark: "Weekly Goal" },
  ];

  const saveGoalsToLocalState = (updatedGoals: StudyGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem("parknote_study_goals_v2", JSON.stringify(updatedGoals));
  };

  const handleToggleGoal = (id: string) => {
    const next = goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g));
    saveGoalsToLocalState(next);
  };

  const handleDeleteGoal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid double toggles
    const next = goals.filter((g) => g.id !== id);
    saveGoalsToLocalState(next);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newGoalText.trim();
    if (!cleanText) return;

    const matchedNote = notes.find((n) => n.id === selectedNoteId);
    const newGoal: StudyGoal = {
      id: Date.now().toString(),
      text: cleanText,
      done: false,
      linkedNoteId: matchedNote?.id,
      linkedNoteTitle: matchedNote?.title,
      targetBenchmark: customBenchmark || "Continuous learning"
    };

    const next = [newGoal, ...goals];
    saveGoalsToLocalState(next);
    setNewGoalText("");
    setSelectedNoteId("");
    setCustomBenchmark("Before Friday");
  };

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmailValue, setNewEmailValue] = useState("");
  const [emailAuthPassword, setEmailAuthPassword] = useState("");
  const [emailAuthError, setEmailAuthError] = useState("");

  const handleOpenEmailModal = () => {
    setNewEmailValue(profileEmail || "");
    setEmailAuthPassword("");
    setEmailAuthError("");
    setIsEmailModalOpen(true);
  };

  const handleSubmitEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAuthPassword) {
      setEmailAuthError("Password is required to change email.");
      return;
    }
    // Verify password locally
    if (emailAuthPassword !== userPassword) {
      setEmailAuthError("Incorrect password. Verification failed.");
      return;
    }
    // Success
    if (onChangeProfileEmail) {
      onChangeProfileEmail(newEmailValue);
    }
    setIsEmailModalOpen(false);
  };

  const handleShuffleAvatar = () => {
    const words = ["Quantum", "Curious", "Scholar", "Physio", "Atom", "Stellar", "Cellular", "Enzyme", "Spark", "Luna", "Aylan", "Helix"];
    const randWord = words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 100);
    onChangeAvatarSeed(randWord);
  };

  const completedCount = goals.filter((g) => g.done).length;
  const progressRatio = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;



  // Combined available premade + custom + seed-generated palettes
  const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>(() => {
    try {
      const saved = localStorage.getItem("parknote_custom_palettes");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const allAvailablePalettes = [...COLOR_PALETTES, ...customPalettes];

  // Colors creator & seed based schemes generator states
  const [customSeedInput, setCustomSeedInput] = useState("");
  const [customNameInput, setCustomNameInput] = useState("");
  const [customBg, setCustomBg] = useState("#0f0c15");
  const [customSurface, setCustomSurface] = useState("#1d152b");
  const [customPrimary, setCustomPrimary] = useState("#ff4e95");
  const [customTertiary, setCustomTertiary] = useState("#00ffb0");

  const handleGenerateFromSeed = () => {
    const seed = customSeedInput.trim();
    if (!seed) return;
    const generated = generatePaletteFromSeed(seed);
    const updated = [generated, ...customPalettes.filter(p => p.id !== generated.id)];
    setCustomPalettes(updated);
    localStorage.setItem("parknote_custom_palettes", JSON.stringify(updated));
    if (onChangePalette) {
      onChangePalette(generated.id);
    }
    setCustomSeedInput("");
  };

  const handleCreateCustomPalette = () => {
    const name = customNameInput.trim() || "My Swatch Palette";
    const id = `custom-h-${Date.now()}`;
    const newPal: ColorPalette = {
      id,
      name,
      creator: "You // Custom Preset",
      colors: {
        background: customBg,
        surface: customSurface,
        surfaceContainer: customSurface,
        surfaceContainerLow: customBg,
        surfaceContainerHigh: customSurface,
        surfaceContainerHighest: customPrimary,
        primary: customPrimary,
        secondary: customPrimary,
        tertiary: customTertiary
      }
    };
    const updated = [newPal, ...customPalettes];
    setCustomPalettes(updated);
    localStorage.setItem("parknote_custom_palettes", JSON.stringify(updated));
    if (onChangePalette) {
      onChangePalette(id);
    }
    setCustomNameInput("");
  };

  const handleDeleteCustomPalette = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPalettes.filter(p => p.id !== id);
    setCustomPalettes(updated);
    localStorage.setItem("parknote_custom_palettes", JSON.stringify(updated));
    // If we deleted the active palette, revert to a default one
    if (activePalette === id && onChangePalette) {
      // Pick first default palette (classic-purple)
      onChangePalette(COLOR_PALETTES[0].id);
    }
  };

  const allGoalsComplete = goals.length > 0 && progressRatio === 100;

  const Achievements = goals.map((goal, idx) => {
    const isUnlocked = allGoalsComplete;
    const icons = [Award, Trophy, Target, Sparkles, CheckCircle2];
    const Icon = icons[idx % icons.length];
    
    return {
      id: goal.id,
      title: goal.text,
      desc: goal.linkedNoteTitle ? `Linked to: ${goal.linkedNoteTitle}` : `Target: ${goal.targetBenchmark}`,
      icon: Icon,
      unlocked: isUnlocked,
      actionLabel: "COMPLETE ALL GOALS TO UNLOCK",
    };
  });

  // Custom A.I. Model Config Hub persist states
  const [hubConfig, setHubConfig] = useState<ModelHubConfig>(DEFAULT_HUB_CONFIG);
  const [activeRoleTab, setActiveRoleTab] = useState<"compiler" | "reviser" | "chat" | "explainer" | "diagram">("compiler");
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("parknote_custom_ai_hub_config");
    if (saved) {
      try {
        setHubConfig({ ...DEFAULT_HUB_CONFIG, ...JSON.parse(saved) });
      } catch (e) {
        setHubConfig(DEFAULT_HUB_CONFIG);
      }
    }
  }, []);

  const handleSaveHubConfig = () => {
    localStorage.setItem("parknote_custom_ai_hub_config", JSON.stringify(hubConfig));
    setIsSavedNotify(true);
    setTimeout(() => {
      setIsSavedNotify(false);
    }, 3000);
    // Raise a visual event to synchronize config
    window.dispatchEvent(new Event("parknote_ai_hub_updated"));
  };

  return (
    <div id="profile-container" className="space-y-6 animate-fade-in max-w-5xl mx-auto font-sans pb-16">
      
      {/* Top M3 Profile Card */}
      <div className="rounded-[28px] bg-[#1D1B20] p-6 border border-[#49454F]/30 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#D0BCFF]/5 blur-[70px] pointer-events-none" />
        
        {/* Dynamic Customizable User Avatar with Glow */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full bg-[#141218] flex items-center justify-center overflow-hidden border-2 border-[#D0BCFF] shadow-lg relative z-10">
            <img
              alt="Dicebear User Avatar"
              className="w-full h-full object-cover shrink-0"
              src={`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${avatarSeed}`}
            />
          </div>
          <button 
            type="button"
            onClick={handleShuffleAvatar}
            className="absolute -bottom-1 -right-1 bg-[#D0BCFF] text-[#21005D] p-1.5 rounded-full hover:bg-[#EADDFF] border border-[#1D1B20] transition duration-200 z-20 shadow cursor-pointer"
            title="Randomize avatar seed"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="text-center md:text-left space-y-1 sm:space-y-1.5 flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">{profileName}</h1>
            <span className="rounded-full bg-[#D0BCFF]/15 px-3 py-0.5 text-[9px] font-bold text-[#D0BCFF] border border-[#D0BCFF]/20 mx-auto md:mx-0 w-max uppercase tracking-wider">
              IMAT PREP // COGNITIVE WORKSPACE
            </span>
          </div>
          <p className="text-xs text-[#CAC4D0] font-mono">{profileEmail || "No email available"}</p>
          <p className="text-xs text-[#938F99] uppercase tracking-wide">{profileBio || "No bio provided"}</p>
        </div>

        {/* Core academic progress and sync alignment status */}
        <div className="flex gap-4 p-3.5 rounded-2xl bg-[#211F26] border border-[#49454F]/30 w-full md:w-auto justify-center items-center">
          <div className="text-center">
            <span className="block text-xs font-bold text-[#A1F000] flex items-center justify-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYNC ACTIVE</span>
            </span>
            <span className="text-[9px] uppercase font-mono text-[#938F99]">IMAT Workspace</span>
          </div>
          <div className="border-l border-[#49454F]/40 h-8" />
          <div className="text-center">
            <span className="block text-xs font-bold text-[#D0BCFF]">{completedCount} / {goals.length}</span>
            <span className="text-[9px] uppercase font-mono text-[#938F99]">Goals Kept</span>
          </div>
        </div>
      </div>

      {/* Grid containing visual customized editor & study analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column Structure */}
        <div className="md:col-span-8 space-y-6">

          {/* M3 COMPLIANT AVATAR & STUDENT SETTINGS PANEL */}
          <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-semibold text-[#CAC4D0] uppercase tracking-wider flex items-center gap-1.5">
              <ScribbleEmblem className="h-4.5 w-4.5 text-[#D0BCFF]" />
              <span>Student Profile &amp; Avatar Studio</span>
            </h2>

            {/* Profile Name input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#CAC4D0] block">Student Profile Name:</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => onChangeProfileName(e.target.value)}
                placeholder="Enter your name... e.g. Aylan Macabalitao"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1D1B20] text-white border border-[#49454F]/35 focus:outline-none focus:border-[#D0BCFF] text-xs font-sans font-bold"
              />
            </div>

            {/* Email field (Read Only + Edit Request) */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] uppercase tracking-widest text-[#CAC4D0] block">Student Email Address:</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={profileEmail || ""}
                  readOnly
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1D1B20] text-zinc-400 border border-[#49454F]/35 focus:outline-none text-xs font-sans font-bold cursor-not-allowed opacity-70"
                />
                <button
                  onClick={handleOpenEmailModal}
                  className="px-4 py-2.5 rounded-xl bg-[#4F378B]/20 text-[#D0BCFF] border border-[#D0BCFF]/30 hover:bg-[#4F378B]/40 transition text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Email Edit Modal Overlay */}
            {isEmailModalOpen && (
              <div className="fixed inset-0 bg-[#0E0D10]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <form 
                  onSubmit={handleSubmitEmailUpdate}
                  className="rounded-3xl border border-[#D0BCFF]/30 bg-[#211F26] p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Update Email Address</h3>
                  <p className="text-[#CAC4D0] text-xs font-sans">
                    Please provide your new email address and verify your current password to proceed.
                  </p>
                  
                  {emailAuthError && (
                    <div className="bg-red-950/30 border border-red-900/50 p-2.5 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wide">
                      {emailAuthError}
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 block font-bold">New Email Address:</label>
                      <input
                        type="email"
                        required
                        value={newEmailValue}
                        onChange={(e) => setNewEmailValue(e.target.value)}
                        placeholder="new.email@university.edu"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1D1B20] text-white border border-[#49454F]/55 focus:outline-none focus:border-[#D0BCFF] text-xs font-sans font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 block font-bold">Current Password:</label>
                      <input
                        type="password"
                        required
                        value={emailAuthPassword}
                        onChange={(e) => setEmailAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1D1B20] text-white border border-[#49454F]/55 focus:outline-none focus:border-[#D0BCFF] text-xs font-mono font-bold tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(false)}
                      className="h-10 text-[10px] font-bold uppercase rounded-xl border border-[#49454F] hover:bg-[#1D1B20] text-[#CAC4D0] transition font-sans cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newEmailValue || !emailAuthPassword}
                      className="h-10 text-[10px] font-bold uppercase rounded-xl bg-[#D0BCFF] text-[#21005D] hover:bg-[#EADDFF] transition font-sans disabled:opacity-40 cursor-pointer"
                    >
                      Confirm Update
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bio input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-[#CAC4D0] block">Student Bio / Subtitle:</label>
              <input
                type="text"
                value={profileBio || ""}
                onChange={(e) => onChangeProfileBio && onChangeProfileBio(e.target.value)}
                placeholder="E.g. University of Sciences // Year 2"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1D1B20] text-white border border-[#49454F]/35 focus:outline-none focus:border-[#D0BCFF] text-xs font-sans font-bold"
              />
            </div>

            {/* Micro style selector chips */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-[#CAC4D0] block">Select Avatar Style:</label>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => onChangeAvatarStyle(style.value)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition duration-150 cursor-pointer ${
                      avatarStyle === style.value
                        ? "bg-[#D0BCFF] border-[#D0BCFF] text-[#21005D] font-bold"
                        : "bg-[#1D1B20] border-[#49454F]/40 hover:border-[#CAC4D0] text-[#CAC4D0]"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom seed input box and random seed shuffle */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-widest text-[#CAC4D0] block mb-1">Custom Character Seed:</label>
                <input
                  type="text"
                  value={avatarSeed}
                  onChange={(e) => onChangeAvatarSeed(e.target.value)}
                  placeholder="Type any random word... e.g. Curie, Einstein"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1D1B20] text-white border border-[#49454F]/35 focus:outline-none focus:border-[#D0BCFF] text-xs font-mono"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleShuffleAvatar}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#4F378B]/20 border border-[#D0BCFF]/30 hover:bg-[#4F378B]/40 text-[#D0BCFF] text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Shuffle Seed</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLOR HUNT WORKSPACE PALETTE PRESETS */}
          <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-5 space-y-5 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-[#49454F]/30">
              <h2 className="text-xs font-semibold text-[#CAC4D0] uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="h-4.5 w-4.5 text-[#D0BCFF]" />
                <span>Workspace Color Hunt Schemes</span>
              </h2>
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest bg-[#D0BCFF]/10 border border-[#D0BCFF]/25 px-2.5 py-1 text-[#D0BCFF] rounded-full">
                Custom Aesthetics
              </span>
            </div>
            
            <p className="text-[#CAC4D0] text-xs leading-relaxed">
              Dynamically recolor your cognitive workspace using hand-picked presets, deterministically generated seed schemes, or your own hand-made color creations.
            </p>

            {/* List Palette Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {allAvailablePalettes.map((p) => {
                const isActive = activePalette === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onChangePalette && onChangePalette(p.id)}
                    className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between gap-3 cursor-pointer group hover:bg-[#1D1B20]/40 ${
                      isActive
                        ? "bg-[#1D1B20] border-[#D0BCFF] ring-1 ring-[#D0BCFF]/30 shadow-[0_0_12px_rgba(208,188,255,0.15)]"
                        : "bg-[#1D1B20]/60 border-[#49454F]/35"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold font-sans truncate ${isActive ? "text-[#D0BCFF]" : "text-white"}`}>
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#A1F000] shadow-[0_0_8px_rgba(161,240,0,0.6)] animate-pulse" />
                          )}
                          {customPalettes.some(cp => cp.id === p.id) && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomPalette(p.id, e)}
                              className="text-[#49454F] hover:text-red-400 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] uppercase font-mono text-zinc-500 mt-1">
                        Creator: {p.creator}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#49454F]/20 mt-1">
                      <span className="text-[9px] uppercase font-mono text-[#CAC4D0]">Combo Swatches:</span>
                      {/* Horizontal Color Hunt Pill Swatch Layout */}
                      <div className="flex h-5 rounded-md overflow-hidden border border-[#49454F]/40 shadow-inner w-24 shrink-0 bg-[#000]/20 p-[1.5px] gap-[1.5px]">
                        <div style={{ backgroundColor: p.colors.background }} className="flex-1 rounded-[3px]" title="Background" />
                        <div style={{ backgroundColor: p.colors.surface }} className="flex-1 rounded-[3px]" title="Surface" />
                        <div style={{ backgroundColor: p.colors.primary }} className="flex-1 rounded-[3px]" title="Primary" />
                        <div style={{ backgroundColor: p.colors.tertiary }} className="flex-1 rounded-[3px]" title="Accent Color" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-creators for seed schemes and custom schemes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#49454F]/25 pt-4 mt-2">
              
              {/* Seed-based palette tool */}
              <div className="p-3.5 rounded-xl bg-[#1D1B20] border border-[#49454F]/20 space-y-2">
                <h3 className="text-[10px] font-bold text-[#CAC4D0] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#D0BCFF]" />
                  <span>Seed-Based Palette Engine</span>
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Hash any keyword to create eye-safety aligned combinations deterministically!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSeedInput}
                    onChange={(e) => setCustomSeedInput(e.target.value)}
                    placeholder="e.g. Bio-filtration, Med Prep, Neon Sea"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#211F26] text-white border border-[#49454F]/35 focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateFromSeed}
                    className="px-3 py-1.5 bg-[#D0BCFF] hover:bg-[#EADDFF] text-[#21005D] font-bold text-xs rounded-lg transition"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Add Custom Color Combo Form */}
              <div className="p-3.5 rounded-xl bg-[#1D1B20] border border-[#49454F]/20 space-y-2.5">
                <h3 className="text-[10px] font-bold text-[#CAC4D0] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Craft Custom Color Scheme</span>
                </h3>
                
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder="E.g. Dark Matcha, Coral Sky"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#211F26] text-white border border-[#49454F]/35 focus:outline-none text-xs"
                  />
                  
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <label className="text-[8px] block text-zinc-500 uppercase">Bg</label>
                      <input
                        type="color"
                        value={customBg}
                        onChange={(e) => setCustomBg(e.target.value)}
                        className="w-full h-7 rounded border border-transparent bg-transparent cursor-pointer"
                        title="Background hex"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] block text-zinc-500 uppercase">Surface</label>
                      <input
                        type="color"
                        value={customSurface}
                        onChange={(e) => setCustomSurface(e.target.value)}
                        className="w-full h-7 rounded border border-transparent bg-transparent cursor-pointer"
                        title="Surface hex"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] block text-zinc-500 uppercase">Primary</label>
                      <input
                        type="color"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        className="w-full h-7 rounded border border-transparent bg-transparent cursor-pointer"
                        title="Primary Color Hue"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] block text-zinc-500 uppercase">Accent</label>
                      <input
                        type="color"
                        value={customTertiary}
                        onChange={(e) => setCustomTertiary(e.target.value)}
                        className="w-full h-7 rounded border border-transparent bg-transparent cursor-pointer"
                        title="Accent Color Hue"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateCustomPalette}
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#0c1f14] font-bold text-xs rounded-lg transition uppercase tracking-wider text-[9px]"
                  >
                    Save & Activate Scheme
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* DYNAMIC GOAL BUILDER MAPPED TO ACTIVE NOTES */}
          <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-[#49454F]/30">
              <h2 className="text-xs font-semibold text-[#CAC4D0] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-4.5 w-4.5 text-[#D0BCFF]" />
                <span>Note-Mapped Study Benchmarks</span>
              </h2>
              <div className="text-[10px] uppercase font-mono text-[#D0BCFF]">
                <span className="text-[#A1F000] font-bold">{progressRatio}%</span> complete
              </div>
            </div>

            {/* Goal List Display */}
            {goals.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No goals created yet. Design your first note-mapped academic benchmark below!
              </div>
            ) : (
              <div className="space-y-2.5 font-sans">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleToggleGoal(g.id)}
                    className="p-3.5 rounded-xl bg-[#1D1B20] border border-[#49454F]/30 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#25232A] transition group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="pt-0.5 shrink-0">
                        {g.done ? (
                          <CheckCircle2 className="h-5 w-5 text-[#A1F000]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#938F99]" />
                        )}
                      </div>
                      
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className={`text-xs font-sans ${g.done ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                          {g.text}
                        </p>
                        
                        {/* Dynamic Note Mapping Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          {g.linkedNoteTitle ? (
                            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#D0BCFF] bg-[#D0BCFF]/10 px-2 py-0.5 rounded border border-[#D0BCFF]/20">
                              <Link2 className="h-2 w-2" />
                              <span className="truncate max-w-[150px]">{g.linkedNoteTitle}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-zinc-800/60 text-[9px] text-[#938F99] px-2 py-0.5 rounded tracking-wide uppercase">
                              General Task
                            </span>
                          )}

                          {g.targetBenchmark && (
                            <span className="text-[9px] font-mono text-[#A1F000] bg-[#A1F000]/5 px-2 py-0.5 rounded border border-[#A1F000]/20">
                              ⏱ {g.targetBenchmark}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteGoal(g.id, e)}
                      className="p-1 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition duration-150"
                      title="Deplane task goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Create Form mapped directly to studied notes */}
            <form onSubmit={handleCreateGoal} className="border-t border-[#49454F]/20 pt-4 mt-2 space-y-3">
              <h3 className="text-[10px] uppercase font-bold tracking-wider text-[#CAC4D0]">Configure New Study Goal Linkage:</h3>
              
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Task outcome, e.g. Solve loop of Henle concentration curves, Memorize chemical buffers"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1B20] text-zinc-100 text-xs border border-[#49454F]/30 focus:outline-none focus:border-[#D0BCFF] outline-none placeholder-zinc-600"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-[#938F99] block mb-1">Associate Studied Note Context:</label>
                    <select
                      value={selectedNoteId}
                      onChange={(e) => setSelectedNoteId(e.target.value)}
                      className="w-full h-9 px-3.5 rounded-xl bg-[#1D1B20] text-zinc-100 text-xs border border-[#49454F]/30 focus:outline-none focus:border-[#D0BCFF]"
                    >
                      <option value="">-- None (General Task Goal) --</option>
                      {notes.map((n) => (
                        <option key={n.id} value={n.id}>
                          [{n.category}] {n.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-[#938F99] block mb-1">Benchmark / Target Date:</label>
                    <input
                      type="text"
                      placeholder="e.g. Before Friday, Next Week"
                      value={customBenchmark}
                      onChange={(e) => setCustomBenchmark(e.target.value)}
                      className="w-full h-9 px-3.5 rounded-xl bg-[#1D1B20] text-zinc-100 text-xs border border-[#49454F]/30 focus:outline-none focus:border-[#D0BCFF] outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-[#D0BCFF] text-[#21005D] text-xs font-bold rounded-xl hover:bg-[#EADDFF] transition duration-150 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Note-linked Study Goal</span>
              </button>
            </form>
          </div>



        </div>

        {/* Right column: Gamified badges & Customizable AI Hub */}
        <div id="achievements-section" className="md:col-span-4 space-y-4">
          
          {/* A.I. CUSTOMIZER HUB CARD */}
          <div className="rounded-2xl border border-[#D0BCFF]/30 bg-[#211F26] p-4 space-y-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 bg-[#A1F000]/5 blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center pb-2 border-b border-[#49454F]/30">
              <h2 className="text-xs font-semibold text-[#CAC4D0] uppercase tracking-wider flex items-center gap-1.5">
                <ScribbleEmblem className="h-4.5 w-4.5 text-[#D0BCFF]" />
                <span>A.I. Model Config Hub</span>
              </h2>
              {isSavedNotify && (
                <span className="text-[10px] text-[#A1F000] font-bold animate-pulse">Saved Successfully!</span>
              )}
            </div>

            <p className="text-[10px] text-[#938F99] leading-relaxed">
              Configure custom keys, endpoints, and models for each LLM or graphic module. Defaults back to our sandbox when keys are empty.
            </p>

            {/* Micro Tab Selector */}
            <div className="grid grid-cols-5 gap-1 bg-[#1D1B20] p-1 rounded-xl">
              {(["compiler", "reviser", "chat", "explainer", "diagram"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveRoleTab(tab)}
                  title={`Configure ${tab}`}
                  className={`py-1.5 px-0.5 rounded-lg text-[9px] font-bold uppercase transition text-center cursor-pointer truncate ${
                    activeRoleTab === tab
                      ? "bg-[#D0BCFF] text-[#21005D]"
                      : "text-[#CAC4D0] hover:bg-[#25232A]"
                  }`}
                >
                  {tab === "compiler" && "Build"}
                  {tab === "reviser" && "Revise"}
                  {tab === "chat" && "Chat"}
                  {tab === "explainer" && "Vocab"}
                  {tab === "diagram" && "Diagram"}
                </button>
              ))}
            </div>

            {/* Tab Editor Form Panel */}
            <div className="space-y-3 pt-1 font-sans">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#938F99] block mb-1">
                  Active Provider ({activeRoleTab.toUpperCase()}):
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {["gemini", "openai", "deepseek"].map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => {
                        const updated = { ...hubConfig };
                        updated[activeRoleTab].provider = prov;
                        // auto fill model fallback
                        if (prov === "gemini") {
                          updated[activeRoleTab].model = activeRoleTab === "diagram" ? "gemini-3.1-flash-image-preview" : "gemini-3.5-flash";
                        } else if (prov === "openai") {
                          updated[activeRoleTab].model = activeRoleTab === "diagram" ? "dall-e-3" : "gpt-4o";
                        } else if (prov === "deepseek") {
                          updated[activeRoleTab].model = "deepseek-chat";
                        }
                        setHubConfig(updated);
                      }}
                      className={`py-1 px-2 text-[10px] rounded-lg border text-center transition cursor-pointer capitalize ${
                        hubConfig[activeRoleTab].provider === prov
                          ? "bg-[#A1F000]/15 border-[#A1F000] text-[#A1F000] font-bold"
                          : "bg-[#1D1B20] border-[#49454F]/40 text-[#CAC4D0] hover:border-[#CAC4D0]"
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                  {["openrouter", "custom"].map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => {
                        const updated = { ...hubConfig };
                        updated[activeRoleTab].provider = prov;
                        if (prov === "openrouter") {
                          updated[activeRoleTab].model = activeRoleTab === "diagram" ? "dall-e-3" : "google/gemini-2.5-flash";
                        }
                        setHubConfig(updated);
                      }}
                      className={`py-1 px-2 text-[10px] rounded-lg border text-center transition cursor-pointer col-span-1.5 capitalize ${
                        hubConfig[activeRoleTab].provider === prov
                          ? "bg-[#A1F000]/15 border-[#A1F000] text-[#A1F000] font-bold"
                          : "bg-[#1D1B20] border-[#49454F]/40 text-[#CAC4D0] hover:border-[#CAC4D0]"
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#938F99] block mb-1">
                  Model Identifier Identifier:
                </label>
                <input
                  type="text"
                  value={hubConfig[activeRoleTab].model}
                  onChange={(e) => {
                    const updated = { ...hubConfig };
                    updated[activeRoleTab].model = e.target.value;
                    setHubConfig(updated);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1D1B20] text-zinc-200 border border-[#49454F]/35 focus:outline-none focus:border-[#D0BCFF] text-xs font-mono"
                  placeholder="e.g. gpt-4o, claude-3-5-sonnet"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-[#938F99] block mb-1">
                  Secret API Key Override:
                </label>
                <input
                  type="password"
                  value={hubConfig[activeRoleTab].apiKey}
                  onChange={(e) => {
                    const updated = { ...hubConfig };
                    updated[activeRoleTab].apiKey = e.target.value;
                    setHubConfig(updated);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1D1B20] text-zinc-200 border border-[#49454F]/35 focus:outline-none focus:border-[#D0BCFF] text-xs font-mono"
                  placeholder={hubConfig[activeRoleTab].provider === "gemini" ? "Optional (using standard environment)" : "Enter API Key override"}
                />
              </div>

              {hubConfig[activeRoleTab].provider === "custom" && (
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-[#938F99] block mb-1">
                    Custom API Endpoint:
                  </label>
                  <input
                    type="text"
                    value={hubConfig[activeRoleTab].endpoint || ""}
                    onChange={(e) => {
                      const updated = { ...hubConfig };
                      updated[activeRoleTab].endpoint = e.target.value;
                      setHubConfig(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#1D1B20] text-zinc-200 border border-[#49454F]/35 focus:outline-none focus:border-[#D0BCFF] text-xs font-mono"
                    placeholder="https://your-custom-gateway.com/v1"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveHubConfig}
                className="w-full py-2 bg-[#A1F000] text-[#0E0D10] text-[11px] font-bold uppercase rounded-xl hover:bg-[#b5ff1a] transition cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Apply & Save Config</span>
              </button>
            </div>
          </div>

          {/* DIAGNOSTIC BADGES */}
          <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-4 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-[#D0BCFF]/5 blur-xl pointer-events-none" />
            
            <div className="flex justify-between items-center pb-2 border-b border-[#49454F]/20">
              <h2 className="text-xs font-semibold text-[#CAC4D0] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-[#D0BCFF]" />
                <span>Diagnostic Badges</span>
              </h2>
            </div>

            {/* Badges Stack */}
            <div className="space-y-3.5 font-sans">
              {Achievements.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-3.5 border flex flex-col gap-3 transition duration-200 relative overflow-hidden ${
                    item.unlocked 
                      ? "bg-[#1D1B20]/95 border-emerald-500/20 shadow-[0_3px_12px_rgba(161,240,0,0.04)]" 
                      : "bg-[#1D1B20]/40 border-[#49454F]/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 transition-transform ${
                      item.unlocked
                        ? "text-[#122b1c] bg-[#A1F000] border-[#A1F000]/60 scale-105"
                        : "text-zinc-600 bg-zinc-950 border-zinc-800"
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`text-xs font-bold uppercase leading-tight ${item.unlocked ? "text-white" : "text-zinc-500"}`}>
                          {item.title}
                        </h3>
                        {item.unlocked && (
                          <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded text-emerald-400 uppercase tracking-widest block h-max">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#CAC4D0] leading-normal font-sans">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Manual Unlock Active Recalls trigger buttons when locked */}
                  {!item.unlocked && (
                    <div className="pt-1.5 border-t border-[#49454F]/20">
                      <div className="w-full py-2 px-3 text-[9px] font-bold uppercase rounded-lg border text-center transition tracking-wider bg-[#1D1B20] border-[#49454F] text-[#938F99]">
                        {item.actionLabel}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { LectureNote, UserAccount, Workspace } from "./types";
import { INITIAL_LECTURE_NOTES } from "./data";
import HomeView from "./components/HomeView";
import RecordView from "./components/RecordView";
import LibraryView from "./components/LibraryView";
import ProfileView from "./components/ProfileView";
import NoteDetailsView from "./components/NoteDetailsView";
import ChatSparkModal from "./components/ChatSparkModal";
import SignInView from "./components/SignInView";
import AdminView from "./components/AdminView";
import ParkNoteLogo from "./components/ParkNoteLogo";

// Curated Palette Config inspired by Color Hunt
export interface ColorPalette {
  id: string;
  name: string;
  creator: string;
  colors: {
    background: string;
    surface: string;
    surfaceContainer: string;
    surfaceContainerLow: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "classic-purple",
    name: "Classic Midnight Lavender",
    creator: "Hunt #4412",
    colors: {
      background: "#121214",
      surface: "#1D1B20",
      surfaceContainer: "#211F26",
      surfaceContainerLow: "#1C1B1F",
      surfaceContainerHigh: "#2B2930",
      surfaceContainerHighest: "#333138",
      primary: "#D0BCFF",
      secondary: "#CCC2DC",
      tertiary: "#A1F000",
    }
  },
  {
    id: "sunset-coral",
    name: "Sunset Ember & Warm Espresso",
    creator: "Hunt #5190",
    colors: {
      background: "#1A1414",
      surface: "#2D1D1D",
      surfaceContainer: "#3D2525",
      surfaceContainerLow: "#241616",
      surfaceContainerHigh: "#4F2B2B",
      surfaceContainerHighest: "#5F3232",
      primary: "#FF4E42",
      secondary: "#FFB085",
      tertiary: "#FEC260",
    }
  },
  {
    id: "emerald-mint",
    name: "Botanic Moss & Sage Green",
    creator: "Hunt #2190",
    colors: {
      background: "#0D1815",
      surface: "#182C27",
      surfaceContainer: "#1E3B33",
      surfaceContainerLow: "#12211D",
      surfaceContainerHigh: "#2A4F44",
      surfaceContainerHighest: "#356658",
      primary: "#52B788",
      secondary: "#74C69D",
      tertiary: "#D8F3DC",
    }
  },
  {
    id: "neon-cyberpunk",
    name: "Neon Glow & Virtual Cyber",
    creator: "Hunt #1080",
    colors: {
      background: "#0F0C16",
      surface: "#1E122B",
      surfaceContainer: "#2B173F",
      surfaceContainerLow: "#170D21",
      surfaceContainerHigh: "#3D1E5E",
      surfaceContainerHighest: "#4E247A",
      primary: "#FF007F",
      secondary: "#7F00FF",
      tertiary: "#00F5FF",
    }
  },
  {
    id: "vintage-peach",
    name: "Retro Cream Peach & Mocha",
    creator: "Hunt #9340",
    colors: {
      background: "#1C1410",
      surface: "#2D1E18",
      surfaceContainer: "#3D2820",
      surfaceContainerLow: "#241813",
      surfaceContainerHigh: "#4B3026",
      surfaceContainerHighest: "#5C3B2E",
      primary: "#E28F83",
      secondary: "#F3D2C1",
      tertiary: "#EDC7B7",
    }
  }
];

import { generatePaletteFromSeed } from "./utils/paletteUtils";

// Resolver utility to support seed-based and user-generated custom palettes
export function findPaletteById(id: string): ColorPalette {
  const foundPremade = COLOR_PALETTES.find(p => p.id === id);
  if (foundPremade) return foundPremade;

  try {
    const savedCustom = localStorage.getItem("parknote_custom_palettes");
    if (savedCustom) {
      const parsed: ColorPalette[] = JSON.parse(savedCustom);
      const foundCustom = parsed.find(p => p.id === id);
      if (foundCustom) return foundCustom;
    }
  } catch (e) {}

  if (id.startsWith("seed-")) {
    const rawSeed = id.replace("seed-", "");
    const formatted = rawSeed.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return generatePaletteFromSeed(formatted || "Custom");
  }

  return COLOR_PALETTES[0];
}

import { Home, Mic, Library, User, Sparkles, MessageSquare, ChevronRight, Shield, LogOut, Plus, FolderPlus, Trash2 } from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, logOut as firebaseLogOut } from "./lib/firebase";

export default function App() {
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [currentTab, setCurrentTab] = useState<"home" | "records" | "library" | "profile" | "admin">("home");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Cognitive dynamic workspace management
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem("parknote_workspaces");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: "imat_prep_cognitive", name: "IMAT PREP // COGNITIVE WORKSPACE", createdAt: new Date().toISOString() },
      { id: "organic_chem_focus", name: "ORGANIC CHEMISTRY FOCUS", createdAt: new Date().toISOString() }
    ];
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    return localStorage.getItem("parknote_active_workspace_id") || "imat_prep_cognitive";
  });

  const [showWorkspaceCreator, setShowWorkspaceCreator] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showDeleteWorkspaceConfirm, setShowDeleteWorkspaceConfirm] = useState(false);

  const handleCreateWorkspace = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const newId = `ws-${Date.now()}`;
    const newWs: Workspace = {
      id: newId,
      name: clean.toUpperCase(),
      createdAt: new Date().toISOString()
    };
    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    localStorage.setItem("parknote_workspaces", JSON.stringify(updated));
    setActiveWorkspaceId(newId);
    localStorage.setItem("parknote_active_workspace_id", newId);
    setNewWorkspaceName("");
    setShowWorkspaceCreator(false);
  };

  const executeDeleteWorkspace = () => {
    if (workspaces.length <= 1) return;
    const updated = workspaces.filter(ws => ws.id !== activeWorkspaceId);
    setWorkspaces(updated);
    localStorage.setItem("parknote_workspaces", JSON.stringify(updated));
    const newActive = updated[0].id;
    setActiveWorkspaceId(newActive);
    localStorage.setItem("parknote_active_workspace_id", newActive);
    setShowDeleteWorkspaceConfirm(false);
  };

  const handleDeleteWorkspace = () => {
    if (workspaces.length <= 1) return;
    setShowDeleteWorkspaceConfirm(true);
  };

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem("parknote_active_workspace_id", id);
    setSelectedNoteId(null); // Unselect active note on workspace shift
  };

  // Filter notes that belong to the active workspace. Link older notes to default.
  const activeWorkspaceNotes = notes.filter(n => {
    const noteWsId = n.workspaceId || "imat_prep_cognitive";
    return noteWsId === activeWorkspaceId;
  });

  // Dynamic Color Hunt Palette Selection
  const [activePalette, setActivePalette] = useState<string>(() => {
    return localStorage.getItem("parknote_color_palette") || "classic-purple";
  });

  // User Accounts & Authentication states
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("parknote_current_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Robust Dicebear avatar customisation state variables
  const [avatarStyle, setAvatarStyleState] = useState(() => {
    const savedUser = localStorage.getItem("parknote_current_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser).avatarStyle;
      } catch (e) {}
    }
    return localStorage.getItem("parknote_avatar_style") || "miniavs";
  });

  const [avatarSeed, setAvatarSeedState] = useState(() => {
    const savedUser = localStorage.getItem("parknote_current_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser).avatarSeed;
      } catch (e) {}
    }
    return localStorage.getItem("parknote_avatar_seed") || "Aylan";
  });

  const [profileName, setProfileNameState] = useState(() => {
    const savedUser = localStorage.getItem("parknote_current_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser).fullName;
      } catch (e) {}
    }
    return localStorage.getItem("parknote_profile_name") || "Aylan Macabalitao";
  });

  // Save utility for accounts list
  const saveAccounts = (updatedList: UserAccount[]) => {
    setAccounts(updatedList);
    localStorage.setItem("parknote_user_accounts", JSON.stringify(updatedList));
  };

  const saveAvatarStyle = (style: string) => {
    setAvatarStyleState(style);
    localStorage.setItem("parknote_avatar_style", style);
    if (currentUser) {
      const updatedUser = { ...currentUser, avatarStyle: style };
      setCurrentUser(updatedUser);
      localStorage.setItem("parknote_current_user", JSON.stringify(updatedUser));
      const nextAccs = accounts.map((a) => (a.id === currentUser.id ? updatedUser : a));
      saveAccounts(nextAccs);
    }
  };

  const saveAvatarSeed = (seed: string) => {
    setAvatarSeedState(seed);
    localStorage.setItem("parknote_avatar_seed", seed);
    if (currentUser) {
      const updatedUser = { ...currentUser, avatarSeed: seed };
      setCurrentUser(updatedUser);
      localStorage.setItem("parknote_current_user", JSON.stringify(updatedUser));
      const nextAccs = accounts.map((a) => (a.id === currentUser.id ? updatedUser : a));
      saveAccounts(nextAccs);
    }
  };

  const saveProfileName = (name: string) => {
    setProfileNameState(name);
    localStorage.setItem("parknote_profile_name", name);
    if (currentUser) {
      const updatedUser = { ...currentUser, fullName: name };
      setCurrentUser(updatedUser);
      localStorage.setItem("parknote_current_user", JSON.stringify(updatedUser));
      const nextAccs = accounts.map((a) => (a.id === currentUser.id ? updatedUser : a));
      saveAccounts(nextAccs);
    }
  };

  const saveProfileEmail = (email: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, email: email };
      setCurrentUser(updatedUser);
      localStorage.setItem("parknote_current_user", JSON.stringify(updatedUser));
      const nextAccs = accounts.map((a) => (a.id === currentUser.id ? updatedUser : a));
      saveAccounts(nextAccs);
    }
  };

  const saveProfileBio = (bio: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, bio: bio };
      setCurrentUser(updatedUser);
      localStorage.setItem("parknote_current_user", JSON.stringify(updatedUser));
      const nextAccs = accounts.map((a) => (a.id === currentUser.id ? updatedUser : a));
      saveAccounts(nextAccs);
    }
  };

  // Reactive Color Hunt Palette Applicator
  useEffect(() => {
    const palette = findPaletteById(activePalette);
    const root = document.documentElement;
    root.style.setProperty("--md-sys-color-background", palette.colors.background);
    root.style.setProperty("--md-sys-color-surface", palette.colors.surface);
    root.style.setProperty("--md-sys-color-surface-container", palette.colors.surfaceContainer);
    root.style.setProperty("--md-sys-color-surface-container-low", palette.colors.surfaceContainerLow);
    root.style.setProperty("--md-sys-color-surface-container-high", palette.colors.surfaceContainerHigh);
    root.style.setProperty("--md-sys-color-surface-container-highest", palette.colors.surfaceContainerHighest);
    root.style.setProperty("--md-sys-color-primary", palette.colors.primary);
    root.style.setProperty("--md-sys-color-secondary", palette.colors.secondary);
    root.style.setProperty("--md-sys-color-tertiary", palette.colors.tertiary);
    
    localStorage.setItem("parknote_color_palette", activePalette);
  }, [activePalette]);

  // Load categories, material, and user accounts from localStorage on mount
  useEffect(() => {
    // 1. Load or initialize User Accounts
    const savedAccs = localStorage.getItem("parknote_user_accounts");
    const demoAccounts: UserAccount[] = [
      {
        id: "usr_aylan",
        email: "aylan@macabalitao.com",
        fullName: "Aylan Macabalitao",
        passwordHash: "aylan",
        role: "user",
        avatarStyle: "miniavs",
        avatarSeed: "Aylan",
        createdAt: new Date().toISOString(),
        status: "active",
        notesCount: 3
      },
      {
        id: "usr_admin",
        email: "admin@parknote.com",
        fullName: "Admin Manager",
        passwordHash: "admin123",
        role: "admin",
        avatarStyle: "bottts",
        avatarSeed: "Admin",
        createdAt: new Date().toISOString(),
        status: "active",
        notesCount: 0
      }
    ];

    if (savedAccs) {
      try {
        setAccounts(JSON.parse(savedAccs));
      } catch (e) {
        setAccounts(demoAccounts);
        localStorage.setItem("parknote_user_accounts", JSON.stringify(demoAccounts));
      }
    } else {
      setAccounts(demoAccounts);
      localStorage.setItem("parknote_user_accounts", JSON.stringify(demoAccounts));
    }

    // 2. Load Categories
    const savedCats = localStorage.getItem("parknote_custom_categories");
    if (savedCats) {
      try {
        setCategories(JSON.parse(savedCats));
      } catch (e) {
        setCategories(["General", "Biology", "Chemistry", "Physics", "Medicine"]);
      }
    } else {
      setCategories(["General", "Biology", "Chemistry", "Physics", "Medicine"]);
    }

    // 3. Load Notes
    const saved = localStorage.getItem("parknote_materials") || localStorage.getItem("notespark_materials");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local material index:", e);
        setNotes(INITIAL_LECTURE_NOTES);
      }
    } else {
      setNotes(INITIAL_LECTURE_NOTES);
    }
  }, []);

  // Listen to Admin self edit records updates
  useEffect(() => {
    const handleAdminSelfUpdate = (e: any) => {
      const { name, email } = e.detail;
      if (currentUser) {
        const updatedUser = { ...currentUser, fullName: name, email };
        setCurrentUser(updatedUser);
        localStorage.setItem("parknote_current_user", JSON.stringify(updatedUser));
        setProfileNameState(name);
        localStorage.setItem("parknote_profile_name", name);
      }
    };
    window.addEventListener("parknote_admin_self_updated", handleAdminSelfUpdate);
    return () => window.removeEventListener("parknote_admin_self_updated", handleAdminSelfUpdate);
  }, [currentUser]);

  // Hook up Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Find existing account by Firebase UID
        let matchingAcc = accounts.find(a => a.id === firebaseUser.uid);
        if (!matchingAcc) {
           // Fallback email match
           matchingAcc = accounts.find(a => a.email.toLowerCase() === firebaseUser.email?.toLowerCase());
        }
        
        if (matchingAcc) {
          setCurrentUser(matchingAcc);
          localStorage.setItem("parknote_current_user", JSON.stringify(matchingAcc));
          setAvatarStyleState(matchingAcc.avatarStyle);
          setAvatarSeedState(matchingAcc.avatarSeed);
          setProfileNameState(matchingAcc.fullName);
        }
      } else {
        // Not signed in
        setCurrentUser(null);
        localStorage.removeItem("parknote_current_user");
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [accounts]);

  const saveNotesToLocal = (updatedNotes: LectureNote[]) => {
    setNotes(updatedNotes);
    localStorage.setItem("parknote_materials", JSON.stringify(updatedNotes));
  };

  const handleUpdateNote = (updatedNote: LectureNote) => {
    const nextList = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    saveNotesToLocal(nextList);
  };

  const handleAddCategory = (newCat: string) => {
    const clean = newCat.trim();
    if (!clean) return;
    if (!categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      const nextCats = [...categories, clean];
      setCategories(nextCats);
      localStorage.setItem("parknote_custom_categories", JSON.stringify(nextCats));
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const nextCats = categories.filter(c => c !== catToDelete);
    setCategories(nextCats);
    localStorage.setItem("parknote_custom_categories", JSON.stringify(nextCats));
  };

  const selectedNote = notes.find((n) => n.id === selectedNodeId()) || null;

  function selectedNodeId() {
    return selectedNoteId;
  }

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
  };

  const handleAddNote = (newNote: LectureNote) => {
    // Tag note with active workspace id
    const noteWithWorkspace = {
      ...newNote,
      workspaceId: activeWorkspaceId
    };
    // If the category doesn't already exist, auto-add it to dynamic presets list!
    if (newNote.category && !categories.some(c => c.toLowerCase() === newNote.category.toLowerCase())) {
      handleAddCategory(newNote.category);
    }
    const nextList = [noteWithWorkspace, ...notes];
    saveNotesToLocal(nextList);
    setSelectedNoteId(newNote.id); // Auto-load generated note!
    setCurrentTab("library");
  };

  const handleDeleteNote = (noteId: string) => {
    const nextList = notes.filter((n) => n.id !== noteId);
    saveNotesToLocal(nextList);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  };

  const handleRestoreDefaults = () => {
    localStorage.removeItem("parknote_materials");
    localStorage.removeItem("notespark_materials");
    localStorage.removeItem("parknote_custom_categories");
    setCategories(["General", "Biology", "Chemistry", "Physics", "Medicine"]);
    setNotes(INITIAL_LECTURE_NOTES);
    setSelectedNoteId(null);
    setCurrentTab("home");
  };

  const handlePlayRecommendedVideo = () => {
    // If we have a note selected, we scroll to its recommended video or activate it!
    if (selectedNote) {
      const el = document.getElementById("lecture-detail-wrapper");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Authentication callbacks
  const handleSignInSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem("parknote_current_user", JSON.stringify(user));
    
    // Synergize profile details
    setAvatarStyleState(user.avatarStyle);
    localStorage.setItem("parknote_avatar_style", user.avatarStyle);
    setAvatarSeedState(user.avatarSeed);
    localStorage.setItem("parknote_avatar_seed", user.avatarSeed);
    setProfileNameState(user.fullName);
    localStorage.setItem("parknote_profile_name", user.fullName);
    
    setCurrentTab("home");
  };

  const handleRegisterAccount = (newAcc: UserAccount) => {
    const updated = [newAcc, ...accounts];
    saveAccounts(updated);
  };

  const handleSignOut = async () => {
    try {
      await firebaseLogOut();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    localStorage.removeItem("parknote_current_user");
    setCurrentTab("home");
    setSelectedNoteId(null);
  };

  // Render correct subview based on current tab selection or loaded selectedNoteId
  const renderTabContent = () => {
    if (selectedNoteId) {
      return (
        <NoteDetailsView
          note={selectedNote!}
          onBack={() => setSelectedNoteId(null)}
          onUpdateNote={handleUpdateNote}
        />
      );
    }

    switch (currentTab) {
      case "home":
        return (
          <HomeView
            notes={activeWorkspaceNotes}
            onSelectNote={handleSelectNote}
            onNavigateToRecord={() => setCurrentTab("records")}
            onOpenChat={() => setIsChatOpen(true)}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            profileName={profileName}
          />
        );
      case "records":
        return (
          <RecordView
            onAddNote={handleAddNote}
            onNavigateToHome={() => setCurrentTab("home")}
            categories={categories}
            onAddCategory={handleAddCategory}
          />
        );
      case "library":
        return (
          <LibraryView
            notes={activeWorkspaceNotes}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            onRestoreDefaults={handleRestoreDefaults}
          />
        );
      case "profile":
        return (
          <ProfileView
            notes={activeWorkspaceNotes}
            avatarStyle={avatarStyle}
            avatarSeed={avatarSeed}
            onChangeAvatarStyle={saveAvatarStyle}
            onChangeAvatarSeed={saveAvatarSeed}
            profileName={profileName}
            onChangeProfileName={saveProfileName}
            profileEmail={currentUser?.email}
            onChangeProfileEmail={saveProfileEmail}
            profileBio={currentUser?.bio}
            onChangeProfileBio={saveProfileBio}
            userPassword={currentUser?.passwordHash}
            activePalette={activePalette}
            onChangePalette={setActivePalette}
          />
        );
      case "admin":
        if (currentUser?.role !== "admin") {
          return (
            <div className="text-zinc-500 italic p-12 text-center bg-[#211F26] rounded-3xl border border-red-900/30">
              Access Denied: Administrative permissions required to access the central user database.
            </div>
          );
        }
        return (
          <AdminView
            accounts={accounts}
            currentUser={currentUser}
            onUpdateAccounts={saveAccounts}
          />
        );
      default:
        return <div className="text-zinc-500">View not found</div>;
    }
  };

  if (!isAuthReady) {
    return <div className="min-h-screen bg-[#121214] flex items-center justify-center text-zinc-500 font-mono text-sm uppercase">Optimizing workspace...</div>;
  }

  // Active session guard
  if (!currentUser) {
    return (
      <SignInView
        accounts={accounts}
        onSignInSuccess={handleSignInSuccess}
        onRegisterAccount={handleRegisterAccount}
      />
    );
  }

  return (
    <div id="parknote-app-shell" className="min-h-screen bg-[#121214] text-[#E6E1E5] flex flex-col font-sans relative pb-28">
      
      {/* MATERIAL DESIGN 3 TOP APPBAR */}
      <header className="h-16 border-b border-[#49454F]/30 bg-[#1D1B20]/90 backdrop-blur-md fixed top-0 w-full z-40 transition-all">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedNoteId && (
              <button
                onClick={() => setSelectedNoteId(null)}
                className="px-4 py-1.5 text-xs rounded-full bg-[#49454F]/40 border border-[#938F99]/30 hover:bg-[#49454F] text-[#D0BCFF] font-medium tracking-wide cursor-pointer"
              >
                Back
              </button>
            )}
            
            <div
              onClick={() => {
                setSelectedNoteId(null);
                setCurrentTab("home");
              }}
            >
              <ParkNoteLogo layout="inline" emblemSize="h-5 w-5" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#211F26] border border-[#49454F]/40 hover:border-[#D0BCFF]/50 px-3 py-1 rounded-full transition duration-150">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-1" />
              <select
                value={activeWorkspaceId}
                onChange={(e) => handleSelectWorkspace(e.target.value)}
                className="bg-transparent text-[9px] font-sans font-extrabold uppercase tracking-widest text-[#CAC4D0] focus:outline-none cursor-pointer border-none outline-none pr-1"
                title="Active Study Workspace"
              >
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id} className="bg-[#1D1B20] text-zinc-300 my-1 text-[10px] font-sans">
                    {ws.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowWorkspaceCreator(true)}
                className="p-1 rounded-full hover:bg-[#49454F]/50 text-[#D0BCFF] transition shrink-0 ml-1.5"
                title="Initialize New Workspace"
              >
                <Plus className="h-2.5 w-2.5 stroke-[3]" />
              </button>
              {workspaces.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteWorkspace}
                  className="p-1 rounded-full hover:bg-red-400/20 text-[#49454F] hover:text-red-400 transition shrink-0"
                  title="Delete Active Workspace"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </div>

            <span className="text-[10px] text-[#CAC4D0] font-mono hidden md:inline bg-[#49454F]/30 border border-[#49454F]/50 px-3 py-1 rounded-full uppercase tracking-wider select-none">
              BUILD // COGNITIVE.8a2f7c0
            </span>

            {/* Exit/LogOut Button */}
            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 text-[10px] uppercase font-sans font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/40 hover:border-red-600/60 rounded-full transition duration-150 flex items-center gap-1 cursor-pointer shrink-0"
              title="Sign out of current active session"
            >
              <LogOut className="h-3 w-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Profile image avatar */}
            <div
              onClick={() => {
                setSelectedNoteId(null);
                setCurrentTab("profile");
              }}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#D0BCFF] cursor-pointer duration-150 shrink-0 bg-[#211F26]"
              title="View student profile stats"
            >
              <img
                alt="User Profile"
                src={`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${avatarSeed}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* CORE DISPLAY MAIN VIEW MODULE */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 mt-24">
        {renderTabContent()}
      </main>

      {/* M3 COZY ELEVATED FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-24 right-5 md:right-8 w-14 h-14 bg-[#D0BCFF] hover:bg-[#EADDFF] text-[#381E72] rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center active:scale-95 transition-all duration-200 z-50 cursor-pointer group"
        title="Toggle AI Study Buddy Chatbot"
      >
        <MessageSquare className="h-6 w-6 group-hover:scale-110 duration-200" />
      </button>

      {/* AI CHAT BUDDY DRAWER MODAL */}
      <ChatSparkModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeNote={selectedNote}
      />

      {/* M3 COMPLIANT BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 w-full z-45 bg-[#1D1B20] border-t border-[#49454F]/30 p-safe pb-4 h-20 flex justify-around items-center">
        <div className="max-w-xl w-full mx-auto flex justify-between items-center px-4">
          
          {/* Tab 1: Home */}
          <button
            onClick={() => {
              setSelectedNoteId(null);
              setCurrentTab("home");
            }}
            className="flex flex-col items-center justify-center flex-1 cursor-pointer group text-xs text-[#CAC4D0]"
          >
            <div className={`flex items-center justify-center w-14 h-8 rounded-full mb-1 transition-all duration-200 ${
              currentTab === "home" && !selectedNoteId
                ? "bg-[#EADDFF] text-[#21005D]"
                : "text-[#CAC4D0] hover:bg-[#CAC4D0]/10"
            }`}>
              <Home className="h-5 w-5" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-sans transition-all ${
              currentTab === "home" && !selectedNoteId ? "font-semibold text-white" : "text-[#CAC4D0]"
            }`}>Home</span>
          </button>

          {/* Tab 2: Records */}
          <button
            onClick={() => {
              setSelectedNoteId(null);
              setCurrentTab("records");
            }}
            className="flex flex-col items-center justify-center flex-1 cursor-pointer group text-xs text-[#CAC4D0]"
          >
            <div className={`flex items-center justify-center w-14 h-8 rounded-full mb-1 transition-all duration-200 ${
              currentTab === "records" && !selectedNoteId
                ? "bg-[#EADDFF] text-[#21005D]"
                : "text-[#CAC4D0] hover:bg-[#CAC4D0]/10"
            }`}>
              <Mic className="h-5 w-5" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-sans transition-all ${
              currentTab === "records" && !selectedNoteId ? "font-semibold text-white" : "text-[#CAC4D0]"
            }`}>Record</span>
          </button>

          {/* Tab 3: Library */}
          <button
            onClick={() => {
              setSelectedNoteId(null);
              setCurrentTab("library");
            }}
            className="flex flex-col items-center justify-center flex-1 cursor-pointer group text-xs text-[#CAC4D0]"
          >
            <div className={`flex items-center justify-center w-14 h-8 rounded-full mb-1 transition-all duration-200 ${
              currentTab === "library" && !selectedNoteId
                ? "bg-[#EADDFF] text-[#21005D]"
                : "text-[#CAC4D0] hover:bg-[#CAC4D0]/10"
            }`}>
              <Library className="h-5 w-5" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-sans transition-all ${
              currentTab === "library" && !selectedNoteId ? "font-semibold text-white" : "text-[#CAC4D0]"
            }`}>Library</span>
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => {
              setSelectedNoteId(null);
              setCurrentTab("profile");
            }}
            className="flex flex-col items-center justify-center flex-1 cursor-pointer group text-xs text-[#CAC4D0]"
          >
            <div className={`flex items-center justify-center w-14 h-8 rounded-full mb-1 transition-all duration-200 ${
              currentTab === "profile" && !selectedNoteId
                ? "bg-[#EADDFF] text-[#21005D]"
                : "text-[#CAC4D0] hover:bg-[#CAC4D0]/10"
            }`}>
              <User className="h-5 w-5" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-sans transition-all ${
              currentTab === "profile" && !selectedNoteId ? "font-semibold text-white" : "text-[#CAC4D0]"
            }`}>Profile</span>
          </button>

          {/* Tab 5: Admin (Conditional) */}
          {currentUser.role === "admin" && (
            <button
              onClick={() => {
                setSelectedNoteId(null);
                setCurrentTab("admin");
              }}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer group text-xs text-red-400"
            >
              <div className={`flex items-center justify-center w-14 h-8 rounded-full mb-1 transition-all duration-200 ${
                currentTab === "admin" && !selectedNoteId
                  ? "bg-[#A1F000] text-black"
                  : "text-red-400/90 hover:bg-red-500/10"
              }`}>
                <Shield className="h-5 w-5" />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-sans transition-all ${
                currentTab === "admin" && !selectedNoteId ? "font-bold text-[#A1F000]" : "text-red-400/80"
              }`}>Admin DB</span>
            </button>
          )}

        </div>
      </nav>

      {/* FLOATING WORKSPACE CREATOR MODAL OVERLAY */}
      {showWorkspaceCreator && (
        <div className="fixed inset-0 bg-[#0E0D10]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="rounded-3xl border border-[#D0BCFF]/30 bg-[#211F26] p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center gap-2 text-[#D0BCFF]">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Initialize Workspace</h3>
            </div>
            
            <p className="text-[#CAC4D0] text-xs leading-relaxed font-sans">
              Create a fresh cognitive repository. Notes, study materials, and dynamic lists will be safely sandboxed within this custom study space.
            </p>

            <div className="space-y-4 pt-1">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="E.g. MCAT PREP, ORGANIC CHEMISTRY"
                className="w-full px-4 h-11 text-xs rounded-xl bg-[#1D1B20] text-white border border-[#49454F]/55 focus:outline-none focus:border-[#D0BCFF] outline-none font-sans uppercase font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newWorkspaceName.trim()) {
                    handleCreateWorkspace(newWorkspaceName);
                  }
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspaceCreator(false);
                    setNewWorkspaceName("");
                  }}
                  className="h-10 text-[10px] font-bold uppercase rounded-xl border border-[#49454F] hover:bg-[#1D1B20] text-[#CAC4D0] transition font-sans cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newWorkspaceName.trim()}
                  onClick={() => handleCreateWorkspace(newWorkspaceName)}
                  className="h-10 text-[10px] font-bold uppercase rounded-xl bg-[#A1F000] text-black hover:bg-[#b5ff1a] transition font-sans disabled:opacity-40 cursor-pointer"
                >
                  Create &amp; Switch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING DELETE WORKSPACE CONFIRM MODAL OVERLAY */}
      {showDeleteWorkspaceConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="rounded-3xl border border-red-900/50 bg-[#1D1B20] p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center gap-2 pb-2 border-b border-[#49454F]/30">
              <Trash2 className="h-4.5 w-4.5 text-red-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-500">Confirm Deletion</h3>
            </div>
            
            <p className="text-[#CAC4D0] text-xs leading-relaxed font-sans">
              Are you sure you want to permanently delete this workspace? All notes and materials scoped to this workspace will no longer be visible unless reassigned.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteWorkspaceConfirm(false)}
                className="h-11 text-xs font-bold uppercase rounded-xl border border-[#49454F] hover:bg-[#211F26] text-[#CAC4D0] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteWorkspace}
                className="h-11 text-xs font-bold uppercase rounded-xl bg-red-600 hover:bg-red-500 text-white transition shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect } from "react";
import { LectureNote } from "../types";
import ScribbleEmblem from "./ScribbleEmblem";
import {
  Search,
  Flame,
  Clock,
  BookOpen,
  ChevronRight,
  Mic,
  Sparkles,
  TrendingUp,
  HelpCircle,
  Folder,
  Dna,
  FlaskConical,
  Activity,
  Brain,
  CheckCircle,
  Play,
  RotateCw,
  Trash2
} from "lucide-react";

interface HomeViewProps {
  notes: LectureNote[];
  onSelectNote: (noteId: string) => void;
  onNavigateToRecord: () => void;
  onOpenChat?: () => void;
  categories: string[];
  onAddCategory: (newCategory: string) => void;
  onDeleteCategory?: (category: string) => void;
  profileName?: string;
}

export default function HomeView({
  notes,
  onSelectNote,
  onNavigateToRecord,
  onOpenChat,
  categories,
  onAddCategory,
  onDeleteCategory,
  profileName = "Aylan Macabalitao"
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Good morning");

  // Dynamic time-based greeting
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) {
      setGreeting("Good morning");
    } else if (hr < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const handleCategoryToggle = (category: string) => {
    if (activeCategory === category) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.course.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory
      ? note.category.toLowerCase() === activeCategory.toLowerCase()
      : true;

    return matchesSearch && matchesCategory;
  });

  // Helper to dynamically theme custom or preset categories
  const getCategoryTheme = (cat: string) => {
    const l = cat.toLowerCase();
    if (l.includes("biolog")) {
      return { icon: Dna, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    }
    if (l.includes("chemist")) {
      return { icon: FlaskConical, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    }
    if (l.includes("physic")) {
      return { icon: Activity, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
    }
    if (l.includes("medicin") || l.includes("anatom") || l.includes("health")) {
      return { icon: Brain, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
    }
    if (l.includes("general")) {
      return { icon: BookOpen, color: "text-[#C5FF41] bg-[#C5FF41]/10 border-[#C5FF41]/30" };
    }
    return { icon: Folder, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" };
  };

  return (
    <div id="home-view-container" className="space-y-10 animate-fade-in pb-16">
      
      {/* M3 Elevated Hero Header Section */}
      <section id="welcome-hero" className="relative overflow-hidden rounded-[28px] bg-[#1D1B20] p-6 md:p-8 border border-[#49454F]/30 shadow-lg">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#D0BCFF]/5 blur-[80px]" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-[#A1F000]/5 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl uppercase font-sans">
              {greeting}, <span className="text-[#D0BCFF]">{profileName.split(" ")[0]}</span>
            </h1>
            <p className="text-[#CAC4D0] font-normal max-w-xl text-xs md:text-sm leading-relaxed">
              Ready to capture today's insights? Speak, dictate, or paste slides to analyze complex mechanisms.
            </p>
          </div>
          
          <button
            onClick={onNavigateToRecord}
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#D0BCFF] hover:bg-[#EADDFF] text-[#21005D] font-bold uppercase tracking-wider py-4 px-6 text-xs transition-all active:scale-95 duration-150 shadow-md shrink-0 w-full md:w-auto"
          >
            <Mic className="h-4.5 w-4.5 text-[#21005D]" />
            <span>Start New Recording</span>
          </button>
        </div>
      </section>

      {/* Section 1: Active & Recent Recordings Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#D0BCFF] uppercase tracking-widest font-sans flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#A1F000] shadow-[0_0_8px_rgba(161,240,0,0.8)] animate-pulse" />
            <span>Active/Recent Recordings</span>
          </h2>
          <span className="text-[10px] text-[#938F99] font-mono hidden md:inline">// Swipe horizontal to review queue</span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
          
          {/* CARD 1: Live Simulation Processing */}
          <div 
            onClick={() => notes[0] && onSelectNote(notes[0].id)}
            className="min-w-[290px] md:min-w-[320px] bg-[#211F26] rounded-2xl p-5 shadow-sm border border-[#A1F000]/30 flex-shrink-0 group hover:border-[#A1F000] transition-all duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#A1F000]/10 text-[#A1F000] border border-[#A1F000]/25 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#A1F000] rounded-full animate-pulse shadow-[0_0_8px_rgba(161,240,0,0.8)]"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider font-sans">LIVE RECORD</span>
              </div>
              <span className="text-[#A1F000] font-mono text-xs font-bold bg-[#1D1B20] px-2.5 py-0.5 rounded-full border border-[#49454F]/50">42:15</span>
            </div>
            
            <h4 className="font-bold text-white text-sm uppercase tracking-tight line-clamp-1 group-hover:text-[#D0BCFF] transition-colors">
              {notes[0] ? notes[0].title : "Cellular Signalling Matrix"}
            </h4>
            <p className="text-[#CAC4D0] text-[11px] font-mono mt-1">
              Active Category: {notes[0] ? notes[0].category : "Anatomy"}
            </p>

            <div className="mt-5 h-1.5 w-full bg-[#1D1B20] rounded-full overflow-hidden border border-[#49454F]/30">
              <div className="h-full bg-[#A1F000] rounded-full w-3/4"></div>
            </div>
          </div>

          {/* CARD 2: Analyzing state card */}
          <div 
            onClick={() => notes[1] && onSelectNote(notes[1].id)}
            className="min-w-[290px] md:min-w-[320px] bg-[#211F26] rounded-2xl p-5 shadow-sm border border-[#49454F]/40 flex-shrink-0 group hover:border-[#D0BCFF]/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#D0BCFF]/10 text-[#D0BCFF] border border-[#D0BCFF]/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <ScribbleEmblem className="h-3.5 w-3.5 text-[#D0BCFF] animate-spin-slow" />
                <span className="text-[9px] font-bold uppercase tracking-wider font-sans">Analyzing Nodes</span>
              </div>
              <span className="text-[#CAC4D0] font-mono text-xs font-bold">58:02</span>
            </div>

            <h4 className="font-bold text-white text-sm uppercase tracking-tight line-clamp-1 group-hover:text-[#D0BCFF] transition-colors">
              {notes[1] ? notes[1].title : "Carbonyl Chemistry Dynamics"}
            </h4>
            <p className="text-[#CAC4D0] text-[11px] font-mono mt-1">
              Course: {notes[1] ? notes[1].course : "BioChemistry"}
            </p>

            <div className="mt-5 flex -space-x-1">
              <div className="w-6 h-6 rounded-full bg-[#1D1B20] border border-[#49454F]/40 flex items-center justify-center text-[#A1F000]" title="Visual Grid Diagram Attached">
                <Dna className="h-3.5 w-3.5" />
              </div>
              <div className="w-6 h-6 rounded-full bg-[#1D1B20] border border-[#49454F]/40 flex items-center justify-center text-[#CAC4D0]" title="Key Vocabulary Terms Ready">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* CARD 3: Completed Card */}
          <div 
            onClick={() => notes[2] && onSelectNote(notes[2].id)}
            className="min-w-[290px] md:min-w-[320px] bg-[#211F26] rounded-2xl p-5 shadow-sm border border-[#49454F]/40 flex-shrink-0 group hover:border-[#D0BCFF]/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#1D1B20] text-[#CAC4D0] border border-[#49454F]/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-[#A1F000]" />
                <span className="text-[9px] font-bold uppercase tracking-wider font-sans">Completed</span>
              </div>
              <span className="text-[#938F99] font-mono text-xs">35:20</span>
            </div>

            <h4 className="font-bold text-white text-sm uppercase tracking-tight line-clamp-1 group-hover:text-[#D0BCFF] transition-colors">
              {notes[2] ? notes[2].title : "Electromagnetic Induction"}
            </h4>
            <p className="text-[#CAC4D0] text-[11px] font-mono mt-1">
              Focus: {notes[2] ? notes[2].tag : "Faraday Law"}
            </p>

            <div className="mt-5 text-[#A1F000] font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <Play className="h-2.5 w-2.5 fill-[#A1F000] text-[#A1F000]" />
              <span>Listen again &amp; review</span>
            </div>
          </div>

        </div>
      </section>

      {/* Section 2: Preset & Custom Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#D0BCFF] uppercase tracking-widest font-sans flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#A1F000]" />
            <span>Preset &amp; Custom Categories</span>
          </h2>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="text-[10px] text-[#A1F000] hover:underline uppercase font-mono tracking-widest flex items-center gap-1"
            >
              <RotateCw className="h-2.5 w-2.5" />
              <span>Reset filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const theme = getCategoryTheme(cat);
            const Icon = theme.icon;
            const noteCount = notes.filter((n) => n.category.toLowerCase() === cat.toLowerCase()).length;
            const isActive = activeCategory?.toLowerCase() === cat.toLowerCase();

            return (
              <div
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`group relative border rounded-2xl p-5 transition-all duration-300 overflow-hidden cursor-pointer ${
                  isActive
                    ? "bg-[#4F378B]/20 border-[#D0BCFF] shadow-[0_0_15px_rgba(208,188,255,0.15)]"
                    : "bg-[#211F26] border-[#49454F]/40 hover:border-[#D0BCFF]/60"
                }`}
              >
                <div className="flex flex-col h-full justify-between gap-6 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#D0BCFF] text-[#21005D]"
                        : `bg-[#EADDFF]/10 ${theme.color} group-hover:bg-[#D0BCFF] group-hover:text-[#21005D]`
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {onDeleteCategory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory(cat);
                        }}
                        className="text-[#49454F] hover:text-red-400 transition p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs font-sans tracking-wider truncate">{cat}</h4>
                    <p className="text-[#CAC4D0] font-mono text-[10px] uppercase mt-1">
                      {noteCount} Note{noteCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon className="h-24 w-24 text-[#D0BCFF]" />
                </div>
              </div>
            );
          })}

          {/* Create Custom Preset Form Card */}
          <div className="bg-[#211F26]/40 border border-dashed border-[#49454F]/60 hover:border-[#D0BCFF]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-150 relative">
            <div className="space-y-1">
              <h4 className="font-bold text-zinc-400 uppercase text-xs font-sans tracking-wider">Custom Preset</h4>
              <p className="text-[10px] text-zinc-500 font-sans leading-tight">Create your own general, exam, or study category</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const val = fd.get("catName") as string;
              if (val?.trim()) {
                onAddCategory(val.trim());
                e.currentTarget.reset();
              }
            }} className="flex items-center gap-1 px-1 py-0.5 bg-[#1C1B1F] rounded-lg border border-[#49454F]/60 focus-within:border-[#D0BCFF] relative z-20">
              <input
                name="catName"
                type="text"
                placeholder="New preset..."
                required
                className="flex-1 min-w-0 bg-transparent py-1 px-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none font-sans"
              />
              <button
                type="submit"
                className="bg-[#D0BCFF] text-[#21005D] text-[11px] font-bold uppercase py-1 px-2.5 rounded-md hover:bg-[#EADDFF] transition cursor-pointer shrink-0"
              >
                +
              </button>
            </form>
          </div>

        </div>
      </section>



      {/* Main Panel Content: Note Library Listing */}
      <div id="main-panel-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* Left Span 8: notes list search */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#D0BCFF] uppercase tracking-widest font-sans">
                Recent Lectures List
              </h2>
              {activeCategory && (
                <span className="bg-[#D0BCFF]/10 border border-[#D0BCFF]/25 text-[#D0BCFF] px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase">
                  filtered to: {activeCategory}
                </span>
              )}
            </div>

            {/* Slick Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#CAC4D0]" />
              <input
                type="text"
                placeholder="Search lectures or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-[#2B2930] py-1.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 border border-[#49454F]/30 focus:outline-none focus:border-[#D0BCFF]"
              />
            </div>
          </div>

          <div id="home-notes-list" className="space-y-3.5">
            {filteredNotes.length === 0 ? (
              <div className="rounded-2xl bg-[#211F26] p-8 border border-dashed border-[#49454F]/50 text-center">
                <p className="text-xs text-[#CAC4D0] font-mono uppercase tracking-wide">No lectures found matching your filter specs.</p>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="mt-2 text-xs text-[#D0BCFF] hover:underline uppercase font-mono tracking-wider font-semibold"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="rounded-2xl bg-[#211F26] p-4 md:p-5 border border-[#49454F]/30 hover:border-[#D0BCFF]/60 cursor-pointer hover:bg-[#2B2930] transition-all duration-200 group flex items-start justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#D0BCFF]/10 px-2.5 py-0.5 text-[9px] font-mono font-bold text-[#D0BCFF] border border-[#D0BCFF]/20 uppercase tracking-wider">
                        {note.category}
                      </span>
                      <span className="text-[10px] text-[#CAC4D0] font-mono">{note.date}</span>
                    </div>
 
                    <h3 className="text-sm font-extrabold text-white group-hover:text-[#D0BCFF] transition-colors uppercase tracking-wide">
                      {note.title}
                    </h3>
                    <p className="text-xs text-[#CAC4D0] line-clamp-2 leading-relaxed font-sans">
                      {note.introduction}
                    </p>
 
                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono pt-1">
                      <span>Course: {note.course}</span>
                      <span>•</span>
                      <span>Focus: {note.tag}</span>
                    </div>
                  </div>
 
                  <div className="p-2.5 rounded-full bg-[#1D1B20] border border-[#49454F]/40 group-hover:bg-[#D0BCFF] group-hover:text-[#21005D] transition duration-200 self-center shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Span 4: AI study tips & Active Recall */}
        <div className="lg:col-span-4 space-y-6">

          {/* Interactive Professor Help Trigger Card */}
          <div className="rounded-2xl bg-[#2B2930] p-5 border border-[#D0BCFF]/10 space-y-3 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D0BCFF]/5 blur-[20px] rounded-full" />
            <div className="flex items-center gap-2 text-[#D0BCFF] font-bold text-[10px] font-sans uppercase tracking-wider">
              <ScribbleEmblem className="h-5 w-5 text-[#A1F000]" />
              <span>Study Engine Connected</span>
            </div>
            <p className="text-xs text-[#CAC4D0] leading-relaxed">
              Stuck on conceptual biological pathways or formulas? Open our Study Spark chat bot anytime to query yourself.
            </p>
          </div>

        </div>
      </div>



    </div>
  );
}

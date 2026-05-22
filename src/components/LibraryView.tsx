import { useState } from "react";
import { LectureNote } from "../types";
import { Search, Folder, Calendar, BookOpen, Trash2, RotateCcw, ArrowRight } from "lucide-react";

interface LibraryViewProps {
  notes: LectureNote[];
  onSelectNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreDefaults: () => void;
}

export default function LibraryView({ notes, onSelectNote, onDeleteNote, onRestoreDefaults }: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(notes.map((note) => note.category)));

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.introduction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? note.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="library-container" className="space-y-6 animate-fade-in pb-16">
      
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#49454F]/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Lecture Library</h1>
          <p className="text-xs text-[#CAC4D0] mt-1 font-sans">02 // Browse study sessions, transcript logs, and recall terms</p>
        </div>

        {/* Restore Defaults button */}
        <button
          onClick={onRestoreDefaults}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1B20] border border-[#49454F]/50 px-4 py-2 text-xs text-[#D0BCFF] hover:text-[#EADDFF] hover:bg-[#211F26] hover:border-[#D0BCFF] transition duration-150 font-bold uppercase tracking-wider text-[10px]"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#D0BCFF]" />
          <span>Restore Original Notes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Filter Options / Topics list */}
        <div className="md:col-span-3 space-y-4">
          <div className="rounded-2xl bg-[#211F26] p-4 border border-[#49454F]/30 space-y-3 shadow-sm">
            <h2 className="text-[11px] font-bold text-[#CAC4D0] uppercase font-sans tracking-widest flex items-center gap-1.5">
              <Folder className="h-4 w-4 text-[#D0BCFF]" />
              <span>Subject Folders</span>
            </h2>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left text-xs px-3.5 py-2.5 rounded-xl font-sans uppercase tracking-wider transition duration-150 flex justify-between items-center ${
                  selectedCategory === null
                    ? "bg-[#4F378B]/25 text-[#D0BCFF] border-l-4 border-[#D0BCFF] font-semibold"
                    : "text-[#CAC4D0] hover:bg-[#1D1B20] hover:text-white"
                }`}
              >
                <span>All Categories</span>
                <span className="text-[9px] font-mono bg-[#1D1B20] border border-[#49454F]/40 px-2 py-0.5 rounded-full text-[#CAC4D0]">{notes.length}</span>
              </button>

              {categories.map((cat) => {
                const count = notes.filter((n) => n.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-xs px-3.5 py-2.5 rounded-xl font-sans uppercase tracking-wider transition duration-150 flex justify-between items-center ${
                      selectedCategory === cat
                        ? "bg-[#4F378B]/25 text-[#D0BCFF] border-l-4 border-[#D0BCFF] font-semibold"
                        : "text-[#CAC4D0] hover:bg-[#1D1B20] hover:text-white"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[9px] font-mono bg-[#1D1B20] border border-[#49454F]/40 px-2 py-0.5 rounded-full text-[#CAC4D0]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Search and Notes lists */}
        <div className="md:col-span-9 space-y-4">
          
          {/* Main Search Block */}
          <div className="relative">
            <Search className="absolute left-4 top-3 h-4.5 w-4.5 text-[#CAC4D0]" />
            <input
              type="text"
              placeholder="Search your library for content, cells, or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-[#2B2930] py-2.5 pl-11 pr-4 text-xs text-white placeholder-zinc-500 border border-[#49454F]/30 focus:outline-none focus:border-[#D0BCFF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredNotes.length === 0 ? (
              <div className="col-span-2 rounded-2xl bg-[#211F26] p-12 border border-dashed border-[#49454F]/50 text-center space-y-2">
                <BookOpen className="h-8 w-8 text-[#938F99] mx-auto" />
                <h3 className="text-sm font-bold text-[#CAC4D0] uppercase">Library segment empty</h3>
                <p className="text-xs text-[#938F99]">No notes fit these folder specifications. Go record or dictate one!</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl bg-[#211F26] border border-[#49454F]/30 hover:border-[#D0BCFF]/60 transition duration-200 p-4 flex flex-col justify-between space-y-4 group relative shadow-sm"
                >
                  <div className="space-y-2.5">
                    {/* Top tags */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#D0BCFF]/10 px-2.5 py-0.5 text-[9px] font-bold text-[#D0BCFF] border border-[#D0BCFF]/20 uppercase tracking-wider">
                        {note.category}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-[#CAC4D0]">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{note.date}</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      <h3
                        onClick={() => onSelectNote(note.id)}
                        className="text-sm font-bold text-white cursor-pointer group-hover:text-[#D0BCFF] transition uppercase tracking-tight"
                      >
                        {note.title}
                      </h3>
                      <p className="text-xs text-[#CAC4D0] line-clamp-2 leading-relaxed">
                        {note.introduction}
                      </p>
                    </div>

                    {/* Course */}
                    <div className="text-[10px] text-[#938F99] font-mono">
                      <span>{note.course} • {note.tag}</span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-[#49454F]/30 flex items-center justify-between">
                    <button
                      onClick={() => onSelectNote(note.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#D0BCFF] group-hover:text-[#EADDFF]"
                    >
                      <span>Study Note</span>
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1 text-[#D0BCFF]" />
                    </button>

                    <button
                      onClick={() => onDeleteNote(note.id)}
                      title="Delete customized session"
                      className="p-2 rounded-full hover:bg-[#1D1B20] text-[#938F99] hover:text-red-400 border border-[#49454F]/30 hover:border-red-500/30 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

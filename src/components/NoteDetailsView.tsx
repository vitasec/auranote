import React, { useState, useRef, useEffect } from "react";
import { LectureNote, DiagramNode } from "../types";
import ScribbleEmblem from "./ScribbleEmblem";
import { 
  ArrowLeft, Share2, Play, ZoomIn, Sparkles, Youtube, Check, Copy, HelpCircle, 
  FileText, Compass, ChevronDown, Search, RefreshCw, AlertCircle, Link2,
  Download, Mic, MicOff, Upload, Code, HelpCircle as HelpIcon
} from "lucide-react";

interface NoteDetailsViewProps {
  note: LectureNote;
  onBack: () => void;
  onUpdateNote?: (updated: LectureNote) => void;
}

const getYoutubeVideoId = (url: string | undefined): string => {
  if (!url) return "dQw4w9WgXcQ";
  const cleaned = url.trim();
  if (cleaned.length === 11) return cleaned;
  const watchMatch = cleaned.match(/[?&]v=([^&#]+)/);
  if (watchMatch) return watchMatch[1];
  const embedMatch = cleaned.match(/\/embed\/([^&#?]+)/);
  if (embedMatch) return embedMatch[1];
  const shortMatch = cleaned.match(/youtu\.be\/([^&#?]+)/);
  if (shortMatch) return shortMatch[1];
  const idMatch = cleaned.match(/([a-zA-Z0-9_-]{11})/);
  if (idMatch) return idMatch[1];
  return "dQw4w9WgXcQ";
};

const getCoordinatePercentage = (val: number | undefined): number => {
  if (val === undefined || val === null) return 50;
  if (val > 0 && val <= 1) {
    return Math.round(val * 100);
  }
  return val;
};

export default function NoteDetailsView({ note, onBack, onUpdateNote }: NoteDetailsViewProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Dynamic Speech to Text, File drag & drop, and manual text states
  const [isRevising, setIsRevising] = useState(false);
  const [manualRevisionText, setManualRevisionText] = useState("");
  const [revisionStatusMessage, setRevisionStatusMessage] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [selectedStudyFileText, setSelectedStudyFileText] = useState("");
  const [studyFileName, setStudyFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Custom diagram image-generation model states
  const [diagramImgUrl, setDiagramImgUrl] = useState<string | null>(null);
  const [isGeneratingDiagramImg, setIsGeneratingDiagramImg] = useState(false);
  const [diagramImgError, setDiagramImgError] = useState<string | null>(null);

  // Custom live highlight selection and explanation states
  const [selectedText, setSelectedText] = useState("");
  const [isExplainingSelection, setIsExplainingSelection] = useState(false);
  const [selectionExplainError, setSelectionExplainError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(`parknote_diagram_image_${note.id}`);
    if (cached) {
      setDiagramImgUrl(cached);
    } else {
      setDiagramImgUrl(null);
    }
  }, [note.id]);

  const handleMouseUpTranscript = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const trimmed = sel.toString().trim();
      if (trimmed.length < 80) {
        setSelectedText(trimmed);
      }
    }
  };

  const handleHighlightAndExplainSelection = async () => {
    const termToExplain = selectedText.trim();
    if (!termToExplain) return;

    setIsExplainingSelection(true);
    setSelectionExplainError(null);

    try {
      const savedConfigStr = localStorage.getItem("parknote_custom_ai_hub_config");
      let customConfig = undefined;
      if (savedConfigStr) {
        try {
          const parsed = JSON.parse(savedConfigStr);
          customConfig = parsed.explainer;
        } catch (e) {
          console.warn("Could not read custom explainer config", e);
        }
      }

      const res = await fetch("/api/explain-phrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phrase: termToExplain,
          noteContextDetail: `Category: ${note.category}. Course: ${note.course}. Intro: ${note.introduction}`,
          config: customConfig
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Explaining phrase failed: ${text}`);
      }

      const data = await res.json();
      const definition = data.explanation || "No explanation provided.";

      const existingTerms = note.terms || [];
      const updatedTerms = existingTerms.filter(t => t.term.toLowerCase() !== termToExplain.toLowerCase());
      updatedTerms.push({
        term: termToExplain,
        definition: definition
      });

      const updatedNote = {
        ...note,
        terms: updatedTerms
      };

      if (onUpdateNote) {
        onUpdateNote(updatedNote);
      }
      setSelectedText("");
      setActiveTerm(termToExplain);
    } catch (err: any) {
      console.error(err);
      setSelectionExplainError(err.message || "Unable to highlight & explain phrase.");
    } finally {
      setIsExplainingSelection(false);
    }
  };

  const handleGenerateDiagramImage = async () => {
    setIsGeneratingDiagramImg(true);
    setDiagramImgError(null);

    try {
      const savedConfigStr = localStorage.getItem("parknote_custom_ai_hub_config");
      let customConfig = undefined;
      if (savedConfigStr) {
        try {
          const parsed = JSON.parse(savedConfigStr);
          customConfig = parsed.diagram;
        } catch (e) {
          console.warn("Could not read custom diagram config", e);
        }
      }

      const res = await fetch("/api/generate-diagram-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteTitle: note.title,
          noteCategory: note.category,
          config: customConfig
        })
      });

      if (!res.ok) {
        let text = await res.text();
        try {
          const jsonError = JSON.parse(text);
          if (jsonError.error) {
             text = typeof jsonError.error === 'string' ? jsonError.error : JSON.stringify(jsonError.error);
          }
        } catch(e) {}
        throw new Error(`Diagram Generation Failed: ${text}`);
      }

      const data = await res.json();
      const imgUrl = data.imageUrl;
      if (imgUrl) {
        setDiagramImgUrl(imgUrl);
        localStorage.setItem(`parknote_diagram_image_${note.id}`, imgUrl);
      } else {
        throw new Error("No image URL was returned.");
      }
    } catch (err: any) {
      console.error(err);
      setDiagramImgError(err.message || "Failed to generate visual sketch schematic model.");
    } finally {
      setIsGeneratingDiagramImg(false);
    }
  };

  // Safe Diagram dynamic compiler fallback
  const safeDiagram = note.diagram && Array.isArray(note.diagram.nodes) && note.diagram.nodes.length > 0
    ? note.diagram
    : {
        title: "Visual Cognitive Model",
        nodes: [
          {
            id: "node-1",
            name: "INITIATION STATE",
            description: `Primary conceptual gateway representing core mechanics of ${note.category || "study subject"}.`,
            type: "primary" as const,
            iconName: "activity" as const,
            x: 25,
            y: 45,
            tooltipText: "Initiation"
          },
          {
            id: "node-2",
            name: "SYNTHESIS PATH",
            description: `Core processing, active recall connections, and vocabulary mapping for intermediate topics.`,
            type: "accent" as const,
            iconName: "waves" as const,
            x: 55,
            y: 60,
            tooltipText: "Synthesis"
          },
          {
            id: "node-3",
            name: "CONSOLIDATED TERMINAL",
            description: `Concluding review terminal and synthesized active recollection outcomes.`,
            type: "warning" as const,
            iconName: "grid" as const,
            x: 80,
            y: 45,
            tooltipText: "Consolidation"
          }
        ],
        connections: [
          { fromId: "node-1", toId: "node-2", label: "Sequential progression" },
          { fromId: "node-2", toId: "node-3", label: "Final consolidation" }
        ]
      };

  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);
  const [diagramMode, setDiagramMode] = useState<"interactive" | "gemini">("interactive");
  const [activeVideoUrl, setActiveVideoUrl] = useState(note.video?.url || "dQw4w9WgXcQ");
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [showAltOptions, setShowAltOptions] = useState(false);

  // Position drag-and-drop mechanics
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    startClientX: number;
    startClientY: number;
  } | null>(null);

  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false);

  const handleNodeDragStart = (e: React.MouseEvent | React.TouchEvent, node: DiagramNode) => {
    e.stopPropagation(); // Avoid triggering deselect or clicks
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      nodeId: node.id,
      startX: node.x,
      startY: node.y,
      startClientX: clientX,
      startClientY: clientY
    };

    setIsCurrentlyDragging(true);

    window.addEventListener("mousemove", handleNodeDragMove);
    window.addEventListener("mouseup", handleNodeDragEnd);
    window.addEventListener("touchmove", handleNodeDragMove, { passive: false });
    window.addEventListener("touchend", handleNodeDragEnd);
  };

  const handleNodeDragMove = (e: MouseEvent | TouchEvent) => {
    if (!dragStartRef.current || !containerRef.current) return;
    
    if (e.cancelable) e.preventDefault(); // Prevent text dragging / scrolling

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dx = clientX - dragStartRef.current.startClientX;
    const dy = clientY - dragStartRef.current.startClientY;

    const pctDx = (dx / rect.width) * 100;
    const pctDy = (dy / rect.height) * 100;

    const targetNodeId = dragStartRef.current.nodeId;
    
    const updatedNodes = safeDiagram.nodes.map(n => {
      if (n.id === targetNodeId) {
        return {
          ...n,
          x: Math.round(Math.max(4, Math.min(96, dragStartRef.current!.startX + pctDx))),
          y: Math.round(Math.max(4, Math.min(96, dragStartRef.current!.startY + pctDy)))
        };
      }
      return n;
    });

    const updatedNote = {
      ...note,
      diagram: {
        ...safeDiagram,
        nodes: updatedNodes
      }
    };
    
    // Sync immediate coordinates update in the node list
    if (onUpdateNote) {
      onUpdateNote(updatedNote);
    }

    // Keep active selectedNode stats in sync
    const matchingNode = updatedNodes.find(n => n.id === targetNodeId);
    if (matchingNode) {
      setSelectedNode(matchingNode);
    }
  };

  const handleNodeDragEnd = () => {
    dragStartRef.current = null;
    setIsCurrentlyDragging(false);
    window.removeEventListener("mousemove", handleNodeDragMove);
    window.removeEventListener("mouseup", handleNodeDragEnd);
    window.removeEventListener("touchmove", handleNodeDragMove);
    window.removeEventListener("touchend", handleNodeDragEnd);
  };

  const handleUpdateSelectedNodeField = (field: "name" | "description" | "x" | "y" | "type", value: any) => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode, [field]: value };
    setSelectedNode(updatedNode);

    const updatedNodes = safeDiagram.nodes.map(n => n.id === selectedNode.id ? updatedNode : n);
    const updatedNote = {
      ...note,
      diagram: {
        ...safeDiagram,
        nodes: updatedNodes
      }
    };
    if (onUpdateNote) {
      onUpdateNote(updatedNote);
    }
  };

  const handleAddDiagramNode = () => {
    const newId = `node-${Date.now()}`;
    const newNode: DiagramNode = {
      id: newId,
      name: "NEW COMPONENT",
      description: "Custom note conceptual point to connect and map flows.",
      type: "accent",
      iconName: "activity",
      x: 50,
      y: 50,
      tooltipText: "Custom"
    };

    const updatedNodes = [...safeDiagram.nodes, newNode];
    const updatedNote = {
      ...note,
      diagram: {
        ...safeDiagram,
        nodes: updatedNodes
      }
    };
    if (onUpdateNote) {
      onUpdateNote(updatedNote);
    }
    setSelectedNode(newNode);
  };

  // Auto-select first diagram node on mount
  useEffect(() => {
    if (safeDiagram.nodes.length > 0) {
      setSelectedNode(safeDiagram.nodes[0]);
    }
  }, [note]);

  // Sync active video url on card update
  useEffect(() => {
    setActiveVideoUrl(note.video?.url || "dQw4w9WgXcQ");
    setCustomInputUrl("");
    setIsVideoPlaying(false);
  }, [note.video?.url]);

  const handleShare = () => {
    setCopiedStatus(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  // ----------------------------------------------------
  // NATIVE VOICE DICTATION & RECORDING LOGIC
  // ----------------------------------------------------
  const recognitionRef = useRef<any>(null);

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRevisionStatusMessage("Web Speech API is not fully supported in this environment yet. Try typing or dragging in files, or use Chrome/Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setRevisionStatusMessage("Voice dictionary channel open. Speak clearly into your mic...");
      };

      rec.onresult = (event: any) => {
        let finalStr = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + " ";
          }
        }
        if (finalStr) {
          setVoiceTranscript((prev) => prev ? prev + " " + finalStr.trim() : finalStr.trim());
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Err:", err);
        setRevisionStatusMessage("Dictation paused or microphone permission requested.");
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      console.error("Failed to bootstrap Speech Recognition:", e);
      setRevisionStatusMessage("Unable to connect microphone services: " + e.message);
    }
  };

  const stopVoiceDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  // ----------------------------------------------------
  // STUDY FILE DRAG & DROP / MANUAL INGESTION LOGIC
  // ----------------------------------------------------
  const handleFileDropIn = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      readSelectedFileContent(files[0]);
    }
  };

  const handleFileSelectedIn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      readSelectedFileContent(files[0]);
    }
  };

  const readSelectedFileContent = (file: File) => {
    setStudyFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setSelectedStudyFileText(text);
        setRevisionStatusMessage(`Ingested: "${file.name}" (${text.length} characters loaded)`);
      }
    };
    reader.onerror = () => {
      setRevisionStatusMessage("Could not parse study document format securely.");
    };
    reader.readAsText(file);
  };

  // ----------------------------------------------------
  // FUSE AI REVISION HANDLER CALLS
  // ----------------------------------------------------
  const triggerAIRevision = async () => {
    const combinedAdditions = [
      manualRevisionText.trim() ? `[Manual Modification / Update]: ${manualRevisionText.trim()}` : "",
      voiceTranscript.trim() ? `[Spoken Dictation Record]: ${voiceTranscript.trim()}` : "",
      selectedStudyFileText.trim() ? `[Text File Import Content - ${studyFileName}]:\n${selectedStudyFileText.trim()}` : "",
    ].filter(Boolean).join("\n\n");

    if (!combinedAdditions.trim()) {
      setRevisionStatusMessage("Please supply some amendments: record a voice memo, drag in a file, or type text revisions.");
      return;
    }

    setIsRevising(true);
    setRevisionStatusMessage("Fusing revision notes with dynamic AI hub engine...");

    try {
      // Load custom reviser configurations
      const savedConfigStr = localStorage.getItem("parknote_custom_ai_hub_config");
      let customConfig = undefined;
      if (savedConfigStr) {
        try {
          const parsed = JSON.parse(savedConfigStr);
          customConfig = parsed.reviser;
        } catch (e) {
          console.warn("Could not read custom reviser config", e);
        }
      }

      const resp = await fetch("/api/revise-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingNote: note,
          additionalContent: combinedAdditions,
          config: customConfig
        })
      });

      if (!resp.ok) {
        throw new Error(`Cloud compiling rejected: HTTP ${resp.status}`);
      }

      const revisedNote: LectureNote = await resp.json();

      if (onUpdateNote) {
        onUpdateNote(revisedNote);
        setRevisionStatusMessage("Revision completed! Highlights, definitions, transcripts, and flow stage models updated.");
        
        // Clean up input fields
        setManualRevisionText("");
        setVoiceTranscript("");
        setSelectedStudyFileText("");
        setStudyFileName("");
      } else {
        setRevisionStatusMessage("Note compiled successfully, but update propagation callback is unavailable.");
      }
    } catch (err: any) {
      console.error("Revision Error:", err);
      setRevisionStatusMessage("Compiling failed: " + err.message);
    } finally {
      setIsRevising(false);
    }
  };

  // ----------------------------------------------------
  // BEAUTIFUL MATERIAL M3 SYSTEM NOTE EXPORTERS
  // ----------------------------------------------------
  const handleExportMarkdown = () => {
    let md = `# ${note.title}\n`;
    md += `**Category**: ${note.category} | **Course**: ${note.course} | **Tag**: ${note.tag}\n`;
    md += `**Revision Date**: ${note.date}\n\n`;
    md += `> ${note.introduction}\n\n`;
    
    md += `## CONCEPTUAL STUDY OVERVIEWS\n`;
    note.summarySections?.forEach((sec) => {
      md += `### ${sec.title}\n`;
      md += `*${sec.description}*\n`;
      sec.bullets?.forEach((b) => {
        md += `- ${b}\n`;
      });
      md += `\n`;
    });

    md += `## LECTURE LEXICON & COGNITIVE TERMS\n`;
    note.terms?.forEach((t) => {
      md += `- **${t.term}**: ${t.definition}\n`;
    });

    md += `\n## VERBATIM TRANSCRIPT RECORD\n`;
    md += `\`\`\`\n${note.transcript}\n\`\`\`\n\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${note.title.toLowerCase().replace(/\s+/g, "_")}_revision_notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.title} - Academic Study Sheet</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #121214;
            color: #E6E1E5;
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px 24px;
            max-width: 900px;
            margin: 0 auto;
        }
        .header-card {
            background: #1D1B20;
            border: 1px solid #49454F;
            border-radius: 28px;
            padding: 32px;
            margin-bottom: 32px;
            position: relative;
        }
        .tag-row {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .tag {
            background: rgba(208, 188, 255, 0.15);
            color: #D0BCFF;
            padding: 4px 12px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid rgba(208, 188, 255, 0.3);
        }
        h1 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 32px;
            color: #FFFFFF;
            margin: 0 0 12px 0;
            letter-spacing: -0.5px;
        }
        .meta-text {
            color: #CAC4D0;
            font-size: 13px;
            font-family: 'JetBrains Mono', monospace;
        }
        .section-card {
            background: #211F26;
            border: 1px solid rgba(73, 69, 79, 0.5);
            border-radius: 24px;
            padding: 24px;
            margin-bottom: 24px;
        }
        h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 20px;
            color: #D0BCFF;
            margin-top: 0;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid rgba(73, 69, 79, 0.3);
            padding-bottom: 8px;
        }
        p {
            font-size: 14px;
            line-height: 1.6;
            color: #CAC4D0;
        }
        ul {
            padding-left: 20px;
            margin-bottom: 0;
        }
        li {
            font-size: 14px;
            color: #CAC4D0;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .term-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px;
            border-radius: 12px;
            background: rgba(29, 27, 32, 0.5);
            margin-bottom: 12px;
            border-left: 3px solid #D0BCFF;
        }
        .term-title {
            font-weight: bold;
            color: #FFFFFF;
            font-size: 14px;
        }
        .term-def {
            font-size: 13px;
            color: #CAC4D0;
        }
        .footer-credit {
            text-align: center;
            font-size: 11px;
            color: #938F99;
            font-family: 'JetBrains Mono', monospace;
            margin-top: 48px;
            text-transform: uppercase;
        }
        @media print {
            body { background: white; color: black; padding: 20px; }
            .header-card, .section-card, .term-item { background: white; border: 1px solid #ccc; color: black; }
            h1, h2, .term-title { color: black; }
            p, li, .term-def { color: #333; }
        }
    </style>
</head>
<body>
    <div class="header-card">
        <div class="tag-row">
            <span class="tag">${note.category}</span>
            <span class="tag">${note.tag}</span>
        </div>
        <h1>${note.title}</h1>
        <div class="meta-text">Course: ${note.course} | Compiled on ${note.date} via ParkNote AI v3.5</div>
        <p style="font-style: italic; font-size: 15px; margin-top: 16px;">${note.introduction}</p>
    </div>

    <div class="section-card">
        <h2>Study Summary Highlights</h2>
        ${note.summarySections?.map((sec) => `
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 15px; color:#FFFFFF; margin-bottom: 4px;">${sec.title}</h3>
                <p style="margin-top:0; font-size:13px; color:#938F99;">${sec.description}</p>
                <ul>
                    ${sec.bullets?.map(b => `<li>${b}</li>`).join("")}
                </ul>
            </div>
        `).join("")}
    </div>

    <div class="section-card">
        <h2>Lecture Vocabulary Lexicon</h2>
        ${note.terms?.map((t) => `
            <div class="term-item">
                <span class="term-title">${t.term}</span>
                <span class="term-def">${t.definition}</span>
            </div>
        `).join("")}
    </div>

    <div class="section-card">
        <h2>Verbatim Transcription Records</h2>
        <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; white-space: pre-wrap; background: rgba(0,0,0,0.2); padding: 16px; border-radius:12px; border:1px solid rgba(73,69,79,0.3); max-height: 400px; overflow-y: auto;">${note.transcript}</p>
    </div>

    <div class="footer-credit">ParkNote AI Engine // Materials Export Finished Successfully</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${note.title.toLowerCase().replace(/\s+/g, "_")}_material_card.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to render icons in Nephron canvas or dynamic network
  const renderNodeIcon = (iconName: string) => {
    switch (iconName) {
      case "drop":
        return (
          <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse">
            <span className="text-sm">💧</span>
          </div>
        );
      case "waves":
        return (
          <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center text-orange-100 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            <span className="text-sm">🌊</span>
          </div>
        );
      case "grid":
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            <span className="text-xs font-mono">⏹</span>
          </div>
        );
      case "activity":
        return (
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse">
            <span className="text-xs font-mono">⚡</span>
          </div>
        );
      case "arrowDown":
        return (
          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            <span className="text-xs font-bold">▼</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <span className="text-sm font-mono">✦</span>
          </div>
        );
    }
  };

  // Helper to wrap terms in the text with interactive lookups
  const renderHighlightedTranscript = () => {
    let text = note.transcript;
    if (!note.terms || note.terms.length === 0) {
      return <p className="text-zinc-300 whitespace-pre-wrap">{text}</p>;
    }

    // Sort terms by length descending to avoid inner-word matching bugs
    const sortedTerms = [...note.terms].sort((a, b) => b.term.length - a.term.length);
    
    // We break the text apart and map elements with high-fidelity popups
    let elements: React.ReactNode[] = [text];

    sortedTerms.forEach(({ term, definition }) => {
      const newElements: React.ReactNode[] = [];
      
      elements.forEach((element) => {
        if (typeof element !== "string") {
          newElements.push(element);
          return;
        }

        // Split text by the exact term casing
        const regex = new RegExp(`(${term})`, "gi");
        const parts = element.split(regex);
        
        parts.forEach((part, index) => {
          if (part.toLowerCase() === term.toLowerCase()) {
            newElements.push(
              <span
                key={`${term}-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTerm(activeTerm === term ? null : term);
                }}
                className="term-highlight text-[#D0BCFF] font-bold hover:underline select-none relative cursor-pointer"
              >
                {part}
                
                {/* Hover/Click Definition Popup */}
                {activeTerm === term && (
                  <span className="absolute bottom-[125%] left-1/2 -translate-x-1/2 bg-[#2D2B33] text-white border border-[#D0BCFF]/30 p-3 rounded-2xl text-xs shadow-2xl z-50 w-64 block font-sans font-normal leading-relaxed text-left pointer-events-auto">
                    <strong className="block text-[#D0BCFF] font-semibold mb-1 uppercase tracking-widest text-[9px]">
                      Definition:
                    </strong>
                    {definition}
                  </span>
                )}
              </span>
            );
          } else {
            newElements.push(part);
          }
        });
      });
      
      elements = newElements;
    });

    return (
      <div className="space-y-4 text-[#CAC4D0] leading-relaxed text-sm md:text-base font-sans">
        {elements.map((el, i) => (
          <span key={i}>{el}</span>
        ))}
      </div>
    );
  };

  return (
    <div
      id="lecture-detail-wrapper"
      onClick={() => setActiveTerm(null)} // Click away closes active vocabs
      className="space-y-8 animate-fade-in pb-16"
    >
      
      {/* 1. Header Toolbar */}
      <span className="block h-0" ref={containerRef} />
      <div className="flex items-center justify-between border-b border-[#49454F]/30 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-[#211F26] group transition duration-150 active:scale-95 text-[#D0BCFF]"
            title="Go back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <h1 className="text-xl font-bold text-[#D0BCFF] font-sans">
            ParkNote Tracker
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#211F26] px-4 py-2 text-xs text-[#D0BCFF] hover:text-[#EADDFF] hover:bg-[#2D2B33] border border-[#49454F]/55 transition duration-150 shrink-0 font-bold cursor-pointer"
          >
            {copiedStatus ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Lecture</span>
              </>
            )}
          </button>

          {/* Export Dropdown Menus */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#D0BCFF] text-[#21005D] px-4 py-2 text-xs hover:bg-[#EADDFF] transition duration-150 font-bold shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-150" style={{ transform: exportDropdownOpen ? "rotate(180deg)" : "none" }} />
            </button>

            {exportDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#211F26] border border-[#49454F] shadow-2xl z-50 p-1.5 space-y-1 block animate-fade-in"
                onMouseLeave={() => setExportDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleExportMarkdown();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#CAC4D0] hover:text-white hover:bg-[#49454F]/30 rounded-xl transition duration-150 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-[#D0BCFF]" />
                  <span>Export Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportHTML();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#CAC4D0] hover:text-white hover:bg-[#49454F]/30 rounded-xl transition duration-150 flex items-center gap-2 cursor-pointer"
                >
                  <Code className="h-4 w-4 text-[#A1F000]" />
                  <span>Printable HTML Card</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta Labels Header Block */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-[#D0BCFF]/15 text-[#D0BCFF] border border-[#D0BCFF]/25 text-[10px] font-bold px-3 py-1 rounded-full font-sans uppercase tracking-wider">
            {note.category}
          </span>
          <span className="text-[#CAC4D0] text-xs font-mono">{note.date}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight uppercase">
          {note.title}
        </h2>
        <p className="text-xs md:text-sm text-[#938F99] font-mono">
          {note.course} • {note.tag}
        </p>
      </div>

      {/* 2. AUTOMATIC REVISION STUDIO PANEL */}
      <section className="rounded-3xl border border-[#D0BCFF]/20 bg-[#211F26] p-5 md:p-6 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#D0BCFF]/5 blur-[60px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#49454F]/40 pb-3">
          <div className="flex items-center gap-2 text-[#D0BCFF]">
            <ScribbleEmblem className="h-5 w-5 text-[#A1F000]" />
            <span className="text-xs font-bold uppercase tracking-wider font-sans text-white">
              ParkNote AI Note Revision Studio
            </span>
          </div>
          <span className="text-[9px] uppercase font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
            FUSES VOICE RECORDINGS, MANUAL CORRECTIONS, & TEXT STUDY DOCS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
          {/* Left Inputs column: Voice recorder and file reader */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Input 1: Voice recorder */}
            <div className="rounded-2xl bg-[#1D1B20] p-4 border border-[#49454F]/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-[#D0BCFF]" />
                  <span>Real-time Voice Memo Dictation</span>
                </span>
                {isRecording && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 animate-pulse">
                    ● Recording Speech
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVoiceDictation}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#4F378B]/20 border border-[#D0BCFF]/20 hover:bg-[#4F378B]/40 text-[#D0BCFF] text-xs font-semibold transition duration-150 cursor-pointer"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Record speech correction</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceDictation}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-950/60 text-red-300 text-xs font-semibold transition duration-150 cursor-pointer"
                  >
                    <MicOff className="h-4 w-4 animate-bounce" />
                    <span>Stop dictating</span>
                  </button>
                )}
              </div>

              {voiceTranscript && (
                <div className="p-3 rounded-xl bg-[#141218] border border-zinc-850 text-xs max-h-24 overflow-y-auto font-sans leading-relaxed text-[#CAC4D0]">
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono mb-1">Captured speech:</p>
                  "{voiceTranscript}"
                  <button 
                    type="button"
                    onClick={() => setVoiceTranscript("")}
                    className="block text-[9px] text-[#D0BCFF] hover:underline mt-1 cursor-pointer"
                  >
                    Clear recording text
                  </button>
                </div>
              )}
            </div>

            {/* Input 2: Study file drop and reader */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDropIn}
              className={`rounded-2xl p-4 border transition duration-150 space-y-2.5 flex flex-col justify-between ${
                isDragOver 
                  ? "bg-[#D0BCFF]/10 border-[#D0BCFF]/50 border-dashed" 
                  : "bg-[#1D1B20] border-[#49454F]/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-[#D0BCFF]" />
                  <span>Ingest Lecture slide / text note</span>
                </span>
                {studyFileName && (
                  <span className="text-[9px] font-mono text-[#A1F000] truncate max-w-[150px]">
                    ✓ {studyFileName}
                  </span>
                )}
              </div>

              <div className="text-center py-3 border border-dashed border-zinc-800 rounded-xl bg-[#141218] hover:bg-[#1D1B20]/40 duration-150 cursor-pointer relative">
                <input
                  type="file"
                  accept=".txt,.md,.json,.js,.tsx,.html"
                  onChange={handleFileSelectedIn}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <p className="text-[11px] text-zinc-400 font-sans">
                  Drag & Drop slide deck text file here or <span className="text-[#D0BCFF] underline">upload</span>
                </p>
                <p className="text-[8px] text-zinc-650 uppercase font-mono mt-0.5">TXT, MD, JSON, HTML formats</p>
              </div>

              {selectedStudyFileText && (
                <div className="flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded-lg">
                  <span className="truncate">Ready for compile</span>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedStudyFileText(""); setStudyFileName(""); }}
                    className="text-red-400 hover:underline cursor-pointer font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Inputs column: Manual notes correction inputs & trigger action button */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-3">
            <div className="flex-1 flex flex-col space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#D0BCFF]" />
                <span>Manual Text Updates & Revisions</span>
              </label>
              <textarea
                rows={4}
                value={manualRevisionText}
                onChange={(e) => setManualRevisionText(e.target.value)}
                placeholder="Type dynamic corrections, amendments or slide details manually..."
                className="w-full h-full min-h-[110px] p-3.5 rounded-2xl bg-[#1D1B20] text-zinc-200 border border-[#49454F]/20 focus:outline-none focus:border-[#D0BCFF] text-xs leading-relaxed outline-none placeholder-zinc-650 resize-none"
              />
            </div>

            <div className="space-y-2 pt-2 md:pt-0">
              {/* Revision output/loader and feedback logger block */}
              {revisionStatusMessage && (
                <div className="p-3 text-xs bg-[#1D1B20]/50 border border-zinc-850 rounded-xl text-zinc-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[#D0BCFF] shrink-0 mt-0.5" />
                  <span className="font-sans leading-relaxed">{revisionStatusMessage}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isRevising}
                onClick={triggerAIRevision}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#D0BCFF] text-[#21005D] text-xs font-bold rounded-2xl hover:bg-[#EADDFF] transition duration-200 disabled:opacity-40 select-none cursor-pointer"
              >
                {isRevising ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Compiling revision in the cloud...</span>
                  </>
                ) : (
                  <>
                    <ScribbleEmblem className="h-4.5 w-4.5" />
                    <span>Compile AI Note Revision</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: AI Summary, Recommended Video, Diagram, Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* BLOCK 1: AI Summary Sections (Left Spans) */}
        <section className="lg:col-span-7 rounded-3xl bg-[#211F26] p-5 md:p-6 border border-[#49454F]/30 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#D0BCFF]">
            <ScribbleEmblem className="h-5 w-5 text-[#D0BCFF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-sans">AI Summary // Multi-concept breakdown</h3>
          </div>

          <div className="bg-[#4F378B]/10 p-4 rounded-2xl border-l-4 border-[#D0BCFF] shadow-inner space-y-4">
            <p className="text-xs md:text-sm text-white leading-relaxed font-sans italic border-b border-[#49454F]/30 pb-3">
              &ldquo;{note.introduction}&rdquo;
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {note.summarySections.map((section, sIdx) => (
                <div key={sIdx} className="bg-[#1D1B20]/60 border border-[#49454F]/35 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-[#D0BCFF] text-xs font-sans uppercase tracking-wider">
                    {section.title}
                  </h4>
                  <p className="text-[11px] text-[#CAC4D0] leading-normal font-sans">
                    {section.description}
                  </p>
                  
                  <ul className="space-y-1.5 pt-1.5 border-t border-[#49454F]/30">
                    {section.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-[11px] text-[#CAC4D0] leading-normal flex items-start gap-1">
                        <span className="text-[#D0BCFF] font-bold shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BLOCK 2: Recommended Video (Right Spans) */}
        <section className="lg:col-span-5 rounded-3xl bg-[#211F26] border border-[#49454F]/30 flex flex-col justify-between overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#49454F]/30 flex items-center justify-between text-[#CAC4D0]">
            <div className="flex items-center gap-1.5">
              <Youtube className="h-5 w-5 text-[#D0BCFF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-sans">Recommended Video //</h3>
            </div>
          </div>

          <div className="relative group bg-zinc-950 aspect-video w-full flex items-center justify-center overflow-hidden">
            {isVideoPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(activeVideoUrl)}?autoplay=1`}
                title={note.video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <>
                <img
                  alt="Anatomy visualization mockup reference"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-35 hover:scale-105 transition-transform duration-500"
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=640&auto=format&fit=crop"
                />

                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="relative z-10 w-14 h-14 bg-[#1D1B20]/90 hover:bg-[#211F26] rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-200 border border-[#D0BCFF]/45 shadow-md text-[#D0BCFF]"
                >
                  <Play className="h-5 w-5 text-[#D0BCFF] fill-[#D0BCFF] ml-0.5" />
                </button>

                <div className="absolute bottom-3 left-3 right-3 text-white z-10 bg-black/80 p-2.5 rounded-xl border border-[#49454F]/30 backdrop-blur-sm">
                  <p className="text-xs font-bold truncate text-white">{note.video.title}</p>
                  <p className="text-[9px] uppercase tracking-wider text-[#D0BCFF] font-mono mt-0.5">
                    {note.video.recommendBy}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-black/30 text-xs text-[#CAC4D0] font-normal leading-relaxed space-y-4">
            <p>{note.video.description}</p>
            
            <div className="border-t border-[#49454F]/30 pt-3 mt-3">
              <div className="flex justify-between items-center text-[#938F99] text-[10px]">
                <span className="flex items-center gap-1 font-sans uppercase tracking-wider">
                  <AlertCircle className="h-3 w-3 text-amber-500 animate-pulse" /> Playback issues or restricted?
                </span>
                <button
                  onClick={() => setShowAltOptions(!showAltOptions)}
                  className="text-[#D0BCFF] hover:text-[#EADDFF] font-bold font-sans uppercase text-[9px] cursor-pointer"
                >
                  {showAltOptions ? "Close Options" : "Alternative Sources"}
                </button>
              </div>

              {showAltOptions && (
                <div className="mt-3.5 space-y-3 pt-2 border-t border-[#49454F]/30 animate-fade-in text-[11px] text-[#CAC4D0]">
                  <p className="leading-normal">
                    Pasted a custom study video URL/ID, or search alternative educational catalogs instantly:
                  </p>
                  
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#CAC4D0]" />
                      <input
                        type="text"
                        placeholder="Paste working YouTube URL / ID..."
                        value={customInputUrl}
                        onChange={(e) => setCustomInputUrl(e.target.value)}
                        className="w-full bg-[#1D1B20] border border-[#49454F]/30 rounded-full px-3.5 py-1.5 pl-8 text-[10.5px] text-zinc-100 placeholder-zinc-550 focus:outline-[#D0BCFF]"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (customInputUrl.trim()) {
                          setActiveVideoUrl(customInputUrl.trim());
                          setIsVideoPlaying(true);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-[#D0BCFF] text-[#21005D] font-bold text-[10px] uppercase font-sans rounded-full hover:bg-[#EADDFF] transition"
                    >
                      Load
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(note.category + " " + note.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 bg-[#211F26] hover:bg-[#2B2930] border border-[#49454F]/30 py-1.5 rounded-full text-[#D0BCFF] transition text-[9px] uppercase font-sans font-bold"
                    >
                      <Search className="h-2.5 w-2.5" /> Direct Search
                    </a>
                    <a
                      href={`https://www.youtube.com/results?search_query=CrashCourse+${encodeURIComponent(note.title || note.category)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 bg-[#D0BCFF]/10 hover:bg-[#D0BCFF]/20 border border-[#D0BCFF]/25 py-1.5 rounded-full text-[#D0BCFF] transition text-[9px] uppercase font-sans font-bold"
                    >
                      🎓 CrashCourse
                    </a>
                    <a
                      href={`https://www.youtube.com/results?search_query=Khan+Academy+${encodeURIComponent(note.title || note.category)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 bg-[#211F26] hover:bg-[#2B2930] border border-[#49454F]/30 py-1.5 rounded-full text-[#D0BCFF] transition text-[9px] uppercase font-sans font-bold col-span-2"
                    >
                      🏫 Search Khan Academy
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BLOCK 3: AI Diagram Model Generator (Full 12 columns visual dashboard) */}
        <section className="lg:col-span-12 rounded-3xl bg-[#211F26] p-5 md:p-6 border border-[#49454F]/30 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#49454F]/20 pb-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[#D0BCFF]">
                <Compass className="h-5 w-5 text-[#D0BCFF]" />
                <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white">🎨 Lecture Diagram Workbench</h3>
              </div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none font-mono">
                Interactive Concept Mapping &amp; AI Media Generation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full bg-[#110F14] p-1 border border-[#49454F]/30">
                <button
                  onClick={() => setDiagramMode("interactive")}
                  className={`px-3.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded-full transition-all duration-150 ${
                    diagramMode === "interactive"
                      ? "bg-[#D0BCFF] text-[#21005D]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Interactive Flow Map
                </button>
                <button
                  onClick={() => setDiagramMode("gemini")}
                  className={`px-3.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded-full transition-all duration-150 ${
                    diagramMode === "gemini"
                      ? "bg-[#D0BCFF] text-[#21005D]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  AI Scientific Render
                </button>
              </div>

              {diagramMode === "gemini" && diagramImgUrl && (
                <button
                  onClick={() => setIsEnlarged(true)}
                  className="inline-flex items-center gap-1.5 text-[10px] text-[#D0BCFF] hover:text-[#EADDFF] border border-[#49454F]/40 px-3 py-1.5 rounded-full bg-[#4F378B]/20 font-sans font-bold uppercase transition cursor-pointer"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  <span>Enlarge Model</span>
                </button>
              )}
            </div>
          </div>

          {diagramMode === "interactive" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* INTERACTIVE DRAG-AND-DROP CANVAS */}
              <div className="lg:col-span-8 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  <span>🚀 Dynamic Draggable Conceptual Stage</span>
                  <span className={`${isCurrentlyDragging ? "text-[#A1F000]" : ""}`}>
                    {isCurrentlyDragging ? "● Repositioning model node..." : "● Drag-and-drop enabled"}
                  </span>
                </div>

                <div
                  ref={containerRef}
                  className="relative h-[480px] bg-[#1d1b20] border border-[#49454F]/35 rounded-2xl overflow-hidden select-none neon-grid flex items-center justify-center p-6 text-center shadow-inner"
                >
                  {/* Glowing Connection lines overlay */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none w-full h-full z-10" preserveAspectRatio="none">
                    {safeDiagram.connections && safeDiagram.connections.map((conn, idx) => {
                      const fromNode = safeDiagram.nodes.find(n => n.id === conn.fromId);
                      const toNode = safeDiagram.nodes.find(n => n.id === conn.toId);
                      if (!fromNode || !toNode) return null;
                      return (
                        <g key={`conn-${idx}`}>
                          <line
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke="#A1F000"
                            strokeWidth={1.2}
                            className="opacity-25"
                          />
                          <line
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke="#D0BCFF"
                            strokeWidth={0.7}
                            strokeDasharray="2,3"
                            className="opacity-60"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Nodes absolutely positioned inside absolute grid space */}
                  {safeDiagram.nodes.length > 0 ? (
                    safeDiagram.nodes.map(node => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onMouseDown={(e) => {
                            setSelectedNode(node);
                            handleNodeDragStart(e, node);
                          }}
                          onTouchStart={(e) => {
                            setSelectedNode(node);
                            handleNodeDragStart(e, node);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                          }}
                          className={`absolute z-20 px-3.5 py-2.5 rounded-2xl border flex items-center gap-2 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                            isSelected
                              ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105"
                              : "bg-[#211F26]/95 text-[#E6E1E5] border-[#49454F]/70 hover:border-[#D0BCFF]/60 hover:bg-[#2B2930] shadow-md"
                          }`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            node.type === "primary" ? "bg-[#D0BCFF]" : node.type === "secondary" ? "bg-[#356658]" : "bg-[#A1F000]"
                          }`} />
                          <span className="text-[10px] font-sans font-black uppercase tracking-wider select-none truncate max-w-[110px]">
                            {node.name}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Conceptual Node Stage Empty</p>
                      <button
                        onClick={handleAddDiagramNode}
                        className="px-4 py-2 bg-[#D0BCFF]/10 text-[#D0BCFF] border border-[#D0BCFF]/30 hover:bg-[#D0BCFF]/20 rounded-xl text-[10px] font-sans font-bold uppercase"
                      >
                        Create Root Concept Node
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* NODE DETAILS SIDE PANEL */}
              <div className="lg:col-span-4 flex flex-col space-y-3">
                <div className="rounded-2xl border border-[#49454F]/30 bg-[#1D1B20]/65 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#49454F]/20 pb-3">
                    <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#D0BCFF]">
                      Active Node Editor
                    </span>
                    <button
                      onClick={handleAddDiagramNode}
                      className="text-[9px] font-sans font-bold uppercase tracking-wider text-black bg-[#A1F000] hover:bg-[#b5ff1a] px-3 py-1 rounded-full transition cursor-pointer"
                    >
                      + Add Node
                    </button>
                  </div>

                  {selectedNode ? (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-[#938F99] font-sans block">Concept Name</label>
                        <input
                          type="text"
                          value={selectedNode.name}
                          onChange={(e) => handleUpdateSelectedNodeField("name", e.target.value)}
                          className="w-full h-9 px-3 rounded-xl bg-[#211F26] text-white border border-[#49454F]/50 text-xs focus:outline-none focus:border-[#D0BCFF] font-sans uppercase font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-[#938F99] font-sans block">Core Scientific Description</label>
                        <textarea
                          value={selectedNode.description}
                          rows={3}
                          onChange={(e) => handleUpdateSelectedNodeField("description", e.target.value)}
                          className="w-full p-3 rounded-xl bg-[#211F26] text-white border border-[#49454F]/50 text-xs focus:outline-none focus:border-[#D0BCFF] resize-none leading-relaxed font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] uppercase font-bold tracking-widest text-[#938F99] font-sans block mb-1">Grid Axis X (%)</label>
                          <input
                            type="number"
                            min={4}
                            max={96}
                            value={selectedNode.x}
                            onChange={(e) => handleUpdateSelectedNodeField("x", parseInt(e.target.value) || 50)}
                            className="w-full h-8 px-2 bg-[#211F26] text-white border border-[#49454F]/40 text-xs rounded-lg text-center font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] uppercase font-bold tracking-widest text-[#938F99] font-sans block mb-1">Grid Axis Y (%)</label>
                          <input
                            type="number"
                            min={4}
                            max={96}
                            value={selectedNode.y}
                            onChange={(e) => handleUpdateSelectedNodeField("y", parseInt(e.target.value) || 50)}
                            className="w-full h-8 px-2 bg-[#211F26] text-white border border-[#49454F]/40 text-xs rounded-lg text-center font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[8px] uppercase font-bold tracking-widest text-[#938F99] font-sans block">Node Visual Color Preset</label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: "primary", hex: "#D0BCFF", label: "Lavender" },
                            { id: "secondary", hex: "#356658", label: "Sage" },
                            { id: "accent", hex: "#A1F000", label: "Neon Lime" }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => handleUpdateSelectedNodeField("type", t.id)}
                              className={`h-7 text-[8px] uppercase font-bold rounded-lg border transition ${
                                selectedNode.type === t.id
                                  ? "bg-white text-black border-white"
                                  : "bg-[#211F26] border-[#49454F]/40 text-[#CAC4D0] hover:bg-[#2B2930]"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#110F14] border border-[#49454F]/25 rounded-2xl p-3.5 text-[10px] space-y-1">
                        <span className="font-bold text-[#A1F000] uppercase block">Flow Mapping Instructions:</span>
                        <span className="text-[#938F99] leading-relaxed block font-sans">
                          All changes in node positions or edited terms are synced instantly and persistent in the cloud-integrated study workspace.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-500 text-xs font-sans">
                      Select or drag any diagram node to inspect coordinates and customize conceptual fields.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* GEMINI DIAGOSTICS IMAGEN GENERATION CANVAS */
            <div className="rounded-2xl border border-[#49454F]/30 relative overflow-hidden min-h-[360px] md:min-h-[440px] bg-[#1d1b20] flex flex-col justify-center items-center p-6 text-center">
              {isGeneratingDiagramImg ? (
                <div className="space-y-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full border-t-2 border-[#A1F000] animate-spin mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-[#A1F000] uppercase tracking-widest font-mono">Synthesizing Visual Grid...</h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Executing custom Image Diffusion / Vector Schematic Model</p>
                  </div>
                </div>
              ) : diagramImgUrl ? (
                <div className="w-full h-full flex flex-col justify-center items-center relative group">
                  {/* Visual generated render frame */}
                  <div className="relative rounded-xl overflow-hidden border border-[#49454F]/40 max-w-3xl w-full bg-[#0E0D10] shadow-2xl transition-all duration-300 group-hover:border-[#D0BCFF]/50">
                    <img
                      src={diagramImgUrl}
                      alt="AI Generated Diagram Model"
                      className="w-full h-auto object-contain max-h-[420px]"
                      referrerPolicy="no-referrer"
                    />

                    {/* Micro action hover controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200">
                      <a
                        href={diagramImgUrl}
                        download={`parknote_diagram_${note.id}.svg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-[#211F26]/90 hover:bg-[#D0BCFF] text-white hover:text-[#21005D] text-xs transition border border-[#49454F]/30"
                        title="Download full resolution vector/image file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#938F99] uppercase font-mono tracking-widest mt-3 flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[#A1F000]" />
                    <span>Stellar diagram compiled using dynamic custom AI graphics module</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-5 max-w-md font-sans">
                  {/* Tech blue-grid aesthetic design box */}
                  <div className="w-16 h-16 rounded-2xl bg-[#D0BCFF]/10 border border-[#D0BCFF]/30 flex items-center justify-center text-[#D0BCFF] mx-auto filter drop-shadow-[0_0_15px_rgba(208,188,255,0.2)]">
                    <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: '12s' }} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">No Diagram Compiled Yet</h4>
                    <p className="text-[#CAC4D0] text-xs leading-relaxed">
                      Instantly generate a highly polished, textbook-grade scientific schematic diagram illustration customized for your note: <strong>{note.title}</strong> ({note.category}).
                    </p>
                  </div>
                  {diagramImgError && (
                    <p className="text-xs text-red-400 font-mono bg-red-950/20 border border-red-900/40 p-2 rounded-xl">{diagramImgError}</p>
                  )}
                  <button
                    onClick={handleGenerateDiagramImage}
                    className="px-6 py-2.5 bg-[#4F378B]/20 text-[#D0BCFF] border border-[#D0BCFF]/30 hover:bg-[#4F378B]/40 transition text-xs font-bold uppercase rounded-xl tracking-wider cursor-pointer"
                  >
                    Compile Schematic Image Model
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* BLOCK 4: Transcript & Terms Dictionary */}
        <section className="lg:col-span-12 rounded-3xl bg-[#211F26] p-5 md:p-6 border border-[#49454F]/30 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#49454F]/30 pb-4">
            <div className="flex items-center gap-1.5">
              <FileText className="h-5 w-5 text-[#D0BCFF]" />
              <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white">Narration Transcript &amp; Key Terms</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="bg-[#D0BCFF]/10 text-[#D0BCFF] text-[10px] font-sans px-3.5 py-1 rounded-full border border-[#D0BCFF]/25 uppercase tracking-wide font-bold">
                Lexicon Matches Active
              </span>
            </div>
          </div>
 
          {/* Interactive highlighted paragraphs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-[11px] text-[#938F99] font-sans uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <HelpCircle className="h-4 w-4 text-[#D0BCFF]" />
                <span>Click highlighted words for dictionary lookup, or select any text to highlight:</span>
              </p>
            </div>
            
            <div 
              onMouseUp={handleMouseUpTranscript}
              className="bg-[#1D1B20]/60 border border-[#49454F]/30 rounded-2xl p-6 md:p-8 cursor-text selection:bg-[#D0BCFF]/30 selection:text-[#D0BCFF]"
              title="Highlight any text with your cursor or write below"
            >
              {renderHighlightedTranscript()}
            </div>

            {/* Dynamic Custom AI Highlighter & Explainer Studio */}
            <div className="p-4 rounded-2xl border border-[#D0BCFF]/20 bg-[#1D1B20]/75 space-y-3 shadow-lg">
              <div className="flex justify-between items-center border-b border-[#49454F]/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#A1F000]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D0BCFF]">Highlighter Lexicon Studio</span>
                </div>
                <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold">Prevents explaining words that aren't highlighted</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    placeholder="Select text with mouse pointer above or type phrase to highlight..."
                    className="w-full h-10 pl-3 pr-20 text-xs rounded-xl bg-[#211F26] text-white border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] outline-none font-sans"
                  />
                  {selectedText && (
                    <button
                      type="button"
                      onClick={() => setSelectedText("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#938F99] uppercase font-bold hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isExplainingSelection || !selectedText.trim()}
                  onClick={handleHighlightAndExplainSelection}
                  className="h-10 px-5 bg-[#A1F000] text-black text-xs font-bold rounded-xl hover:bg-[#b0ff1a] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isExplainingSelection ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Explaining &amp; Highlighting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Highlight &amp; Explain Phrase</span>
                    </>
                  )}
                </button>
              </div>

              {selectionExplainError && (
                <p className="text-[10px] text-red-400 font-mono bg-red-950/25 border border-red-900/40 px-3 py-1 rounded-xl">{selectionExplainError}</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* FULL-SCREEN MODE ENLARGED SVG DIALOG MODAL */}
      {isEnlarged && (
        <div className="fixed inset-0 bg-[#0E0D10]/98 backdrop-blur-lg z-50 flex flex-col justify-between p-6 animate-fade-in text-white overflow-hidden">
          
          {/* enlarge header */}
          <div className="flex justify-between items-center pb-4 border-b border-[#49454F]/30 select-none">
            <div>
              <h2 className="text-lg font-sans font-bold text-[#D0BCFF] uppercase">{note.title} (Enlarged Model Schematic)</h2>
              <p className="text-xs text-[#CAC4D0] mt-0.5 font-sans uppercase tracking-wider font-semibold">High contrast visual diagram</p>
            </div>
            <button
              onClick={() => setIsEnlarged(false)}
              className="px-5 py-2.5 bg-[#211F26] hover:bg-[#D0BCFF] text-white hover:text-black hover:scale-105 text-xs font-sans font-bold uppercase rounded-full transition cursor-pointer"
            >
              Close Overlay
            </button>
          </div>
 
          {/* enlarged body rendering */}
          <div className="flex-1 flex flex-col justify-center items-center py-6 relative space-y-4 overflow-auto">
            {diagramImgUrl ? (
              <div className="max-w-4xl w-full border border-[#49454F]/50 rounded-2xl overflow-hidden bg-black shadow-2xl relative z-10">
                <img
                  src={diagramImgUrl}
                  alt="Enlarged Diagram Model"
                  className="w-full h-auto object-contain max-h-[70vh]"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <p className="text-[#CAC4D0] text-sm italic">No diagram compiled to view enlarged schematic.</p>
            )}
            
            <div className="text-center max-w-xl bg-[#211F26] p-4 rounded-xl border border-[#49454F]/30 relative z-20 font-sans uppercase text-[10px] tracking-wider text-[#CAC4D0] font-bold">
              <p>
                Analyze structural flows, download original files, or run revised speech tests for this note to build maximum recall memory.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

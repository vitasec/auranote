export interface AISummarySection {
  title: string;
  description: string;
  bullets: string[];
}

export interface DiagramNode {
  id: string;
  name: string;
  description: string;
  type: "primary" | "secondary" | "accent" | "warning";
  iconName: "drop" | "arrowDown" | "arrowUp" | "grid" | "waves" | "activity";
  x: number; // Position X as percentage (0-100)
  y: number; // Position Y as percentage (0-100)
  tooltipText: string;
}

export interface DiagramConnection {
  fromId: string;
  toId: string;
  label?: string;
  colorClass?: string;
}

export interface LectureDiagram {
  title: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
}

export interface VocabularyTerm {
  term: string;
  definition: string;
}

export interface LectureNote {
  id: string;
  workspaceId?: string; // Links note to a specific cognitive workspace session
  title: string;
  category: string;
  date: string;
  course: string;
  tag: string;
  introduction: string;
  summarySections: AISummarySection[];
  video: {
    title: string;
    recommendBy: string;
    description: string;
    url?: string;
  };
  diagram: LectureDiagram;
  transcript: string;
  terms: VocabularyTerm[];
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "model" | "system";
  text: string;
  id: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: "admin" | "user";
  avatarStyle: string;
  avatarSeed: string;
  createdAt: string;
  status: "active" | "suspended";
  notesCount: number;
  bio?: string;
}


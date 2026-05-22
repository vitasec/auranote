import React from "react";

interface ScribbleEmblemProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  strokeWidth?: number;
}

export default function ScribbleEmblem({ className = "h-5 w-5", strokeWidth = 1.2, ...props }: ScribbleEmblemProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 
         High-fidelity hand-drawn scribble orb. 
         Recreates the circular hand-drawn scribble ball of string from the sketch with overlapping spirals and hatches.
      */}
      {/* 1. Deep inner chaotic scribble loops with nested paths */}
      <path 
        d="M50,47 C48,48 46,51 48,53 C51,55 54,50 53,48 C51,45 44,48 43,51 C42,56 50,58 54,55 C58,51 52,42 46,42 C39,42 35,51 39,57 C43,63 54,63 59,56 C64,48 57,35 48,36 C37,37 31,49 37,60 C43,71 59,69 65,57 C71,44 59,29 46,29 C31,29 23,46 31,62 C39,77 64,76 72,59 C80,40 63,21 44,22 C24,23 14,47 25,67 C36,87 69,85 79,62 C88,38 68,13 44,14 C18,15 6,45 21,70 C35,94 75,90 85,61 C95,32 71,5 43,7" 
        strokeWidth={strokeWidth * 0.95} 
        className="opacity-90" 
      />
      
      {/* 2. Overlapping concentric wavy orbits rotating around the center */}
      <path 
        d="M49,15 C64,12 82,23 84,41 C87,59 70,79 51,81 C32,83 16,66 17,46 C18,26 36,16 49,15 Z" 
        strokeWidth={strokeWidth * 1.1} 
      />
      
      <path 
        d="M51,19 C67,20 80,33 79,51 C78,69 59,82 41,79 C23,76 13,57 16,39 C19,21 35,15 51,19 Z" 
        strokeWidth={strokeWidth * 1.2} 
        className="opacity-95" 
      />
      
      <path 
        d="M44,24 C56,22 70,30 72,44 C74,58 60,73 45,72 C30,71 19,58 21,44 C23,30 30,25 44,24 Z" 
        strokeWidth={strokeWidth * 0.9} 
      />

      {/* 3. Cross-diagonal loops to represent string winding structure */}
      <path 
        d="M48,27 C66,38 74,60 60,74 C46,88 22,76 18,58 C14,40 30,14 48,27 Z" 
        strokeWidth={strokeWidth * 1.05} 
        className="opacity-80" 
      />
      
      <path 
        d="M51,31 C33,41 25,63 37,76 C49,89 71,76 75,58 C79,40 69,20 51,31 Z" 
        strokeWidth={strokeWidth * 1.1} 
        className="opacity-85" 
      />

      {/* 4. Fine-line jittery boundary rings to soften the sphere border representation */}
      <path 
        d="M50,4 C72,9 92,29 92,51 C92,73 72,93 48,93 C24,93 4,69 8,47 C12,25 28,0 50,4 Z" 
        strokeWidth={strokeWidth * 0.75} 
        className="opacity-60" 
        strokeDasharray="160 8" 
      />
      
      <path 
        d="M50,7 C27,11 9,31 11,55 C13,79 33,87 55,85 C77,83 87,59 83,37 C79,15 71,3 50,7 Z" 
        strokeWidth={strokeWidth * 0.65} 
        className="opacity-50" 
        strokeDasharray="190 12" 
      />

      {/* 5. Center-most tight core coils */}
      <path 
        d="M36,50 C36,42 43,35 51,35 C59,35 66,42 66,50 C66,58 59,65 51,65 C43,65 36,58 36,50 Z" 
        strokeWidth={strokeWidth * 1.3} 
        className="opacity-95" 
      />
      
      <path 
        d="M41,50 C41,45 45,41 51,41 C57,41 61,45 61,50 C61,55 57,59 51,59 C45,59 41,55 41,50 Z" 
        strokeWidth={strokeWidth * 1.45} 
      />
      
      <path 
        d="M31,54 C39,31 63,31 71,54 C66,71 36,71 31,54 Z" 
        strokeWidth={strokeWidth * 1.1} 
        className="opacity-85" 
      />
      
      <path 
        d="M56,29 C79,37 79,61 56,69 C33,64 33,34 56,29 Z" 
        strokeWidth={strokeWidth * 1.15} 
        className="opacity-85" 
      />
    </svg>
  );
}

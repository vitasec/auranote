import React from "react";
import ScribbleEmblem from "./ScribbleEmblem";

interface ParkNoteLogoProps {
  layout?: "stacked" | "inline";
  className?: string;
  emblemSize?: string;
}

export default function ParkNoteLogo({ 
  layout = "inline", 
  className = "", 
  emblemSize = "h-6 w-6" 
}: ParkNoteLogoProps) {
  
  if (layout === "stacked") {
    return (
      <div className={`flex flex-col items-center justify-center select-none text-center relative py-6 ${className}`}>
        {/* Only the spinning ScribbleEmblem with high-fidelity glow/shadow */}
        <div className="bg-[#1D1B20]/40 p-4 rounded-full border border-[#D0BCFF]/10 backdrop-blur-sm shadow-[0_0_30px_rgba(161,240,0,0.15)]">
          <ScribbleEmblem 
            className="h-28 w-28 text-[#A1F000] drop-shadow-[0_0_16px_rgba(161,240,0,0.4)] animate-spin-slow" 
            strokeWidth={1.4} 
          />
        </div>
      </div>
    );
  }

  // Horizontal Compact Layout: Just the spinning emblem to represent the app identity
  return (
    <div className={`flex items-center justify-center select-none cursor-pointer group hover:opacity-95 duration-150 ${className}`}>
      <div className="relative flex items-center justify-center bg-[#1D1B20]/30 p-1 rounded-full border border-white/5 shadow-inner">
        <ScribbleEmblem 
          className={`${emblemSize} text-[#A1F000] rotate-0 group-hover:rotate-180 transition-transform duration-700 animate-spin-slow`} 
          strokeWidth={1.3} 
        />
      </div>
    </div>
  );
}


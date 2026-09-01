'use client';

import React from 'react';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenIntake: () => void;
  reviewCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onOpenIntake,
  reviewCount,
}) => {
  return (
    <header className="border-b border-[#E2E0D8] bg-[#FFFFFF] sticky top-0 z-30">
      {/* Top institutional strip */}
      <div className="px-4 md:px-6 py-2 bg-[#F2F1EC] border-b border-[#E5E3DC] text-[11px] flex flex-wrap items-center justify-between text-[#5E5D57]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#1A1917] tracking-wider uppercase">
            MedParse Operations System
          </span>
          <span className="text-[#C6C4BA]">|</span>
          <span>Workspace: Central District Hospital · Claims & Billing</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#EAE8DF] border border-[#D5D3C8] text-[#4A4842] font-mono text-[10px] rounded-[2px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C4D35]" />
            Synthetic Mode Active
          </span>
          <span className="text-[#89877E] font-mono">Build 2026.09-rc1</span>
        </div>
      </div>

      {/* Main operational bar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => onNavigate('workspace')}
            className="cursor-pointer select-none"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-[#1A1917] font-mono">
                MEDPARSE
              </span>
              <span className="text-xs text-[#5E5D57] hidden sm:inline">
                Clinical documents, structured.
              </span>
            </div>
          </div>

          {/* Primary View Navigation */}
          <nav className="flex items-center space-x-1 pl-4 border-l border-[#E2E0D8]">
            <button
              onClick={() => onNavigate('workspace')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors ${
                activeView === 'workspace'
                  ? 'bg-[#1A1917] text-[#FFFFFF]'
                  : 'text-[#5E5D57] hover:bg-[#F2F1EC] hover:text-[#1A1917]'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => onNavigate('documents')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors ${
                activeView === 'documents'
                  ? 'bg-[#1A1917] text-[#FFFFFF]'
                  : 'text-[#5E5D57] hover:bg-[#F2F1EC] hover:text-[#1A1917]'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => onNavigate('review')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors inline-flex items-center gap-1.5 ${
                activeView === 'review'
                  ? 'bg-[#1A1917] text-[#FFFFFF]'
                  : 'text-[#5E5D57] hover:bg-[#F2F1EC] hover:text-[#1A1917]'
              }`}
            >
              <span>Review Queue</span>
              {reviewCount > 0 && (
                <span className={`px-1.5 py-0.2 font-mono text-[10px] rounded-[2px] font-bold ${
                  activeView === 'review' 
                    ? 'bg-[#FDF6E4] text-[#855304]' 
                    : 'bg-[#FDF6E4] text-[#855304] border border-[#EBD9A4]'
                }`}>
                  {reviewCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('claims')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors ${
                activeView === 'claims'
                  ? 'bg-[#1A1917] text-[#FFFFFF]'
                  : 'text-[#5E5D57] hover:bg-[#F2F1EC] hover:text-[#1A1917]'
              }`}
            >
              Claim Records
            </button>
          </nav>
        </div>

        {/* Quick action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenIntake}
            className="px-3.5 py-1.5 bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 active:translate-y-px"
          >
            <span>+ Add Document</span>
          </button>
        </div>
      </div>
    </header>
  );
};

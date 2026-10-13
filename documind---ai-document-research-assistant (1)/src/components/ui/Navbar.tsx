import React from 'react';
import {
  BookOpen,
  MessageSquare,
  FileText,
  LayoutDashboard,
  BarChart2,
  Settings,
  Info,
} from 'lucide-react';
import { DocumentRecord } from '../../types/index.ts';

export type NavTab = 'workspace' | 'documents' | 'dashboard' | 'evaluation' | 'settings' | 'landing';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  documents: DocumentRecord[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  documents,
}) => {
  const readyCount = documents.filter((d) => d.status === 'Ready').length;

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'workspace', label: 'Workspace', icon: <MessageSquare size={15} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'evaluation', label: 'Evaluation', icon: <BarChart2 size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
    { id: 'landing', label: 'About', icon: <Info size={15} /> },
  ];

  return (
    <header className="h-[60px] bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-40 select-none shadow-2xs">
      {/* Brand Logo */}
      <div
        onClick={() => onTabChange('landing')}
        className="flex items-center gap-2.5 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
          <BookOpen size={17} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            Docu<span className="text-indigo-600">Mind</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
            Research AI
          </span>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.id === 'documents' && readyCount > 0 && (
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  {readyCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Source Count Indicator */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        <span className="font-mono text-[11px] text-slate-600">
          {readyCount} {readyCount === 1 ? 'doc indexed' : 'docs indexed'}
        </span>
      </div>
    </header>
  );
};

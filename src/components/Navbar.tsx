import React from "react";
import { User, Role } from "../types";
import { Video, LogOut, Briefcase, Sparkles, UserCheck, Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 glassmorphism border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <Video className="w-5 h-5" />
        </div>
        <div>
          <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            HireReel <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI</span>
          </span>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider -mt-0.5">VIDEO-FIRST HIRING PLATFORM</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {user ? (
          <>
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
                {user.role === "recruiter" ? (
                  <>
                    <Shield className="w-3 h-3 text-emerald-500" /> Recruiter
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3 h-3 text-indigo-500" /> Candidate
                  </>
                )}
              </span>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

            <button
              onClick={onLogout}
              id="btn-logout"
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-850 font-medium text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide">
            <span>SECURED CONNECT</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        )}
      </div>
    </nav>
  );
}

import React, { useState, useEffect } from "react";
import { User } from "./types";
import Navbar from "./components/Navbar";
import AuthPage from "./components/AuthPage";
import CandidateDashboard from "./components/CandidateDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import { Sparkles, Video } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Attempt to restore user authenticated session from localStorage
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: {
              "Authorization": `Bearer ${savedToken}`
            }
          });

          if (res.ok) {
            const userData = await res.json();
            setToken(savedToken);
            setUser(userData);
          } else {
            // Token was expired or invalid
            localStorage.removeItem("token");
          }
        } catch (err) {
          console.error("Session recovery error:", err);
        }
      }
      setIsInitializing(false);
    }
    restoreSession();
  }, []);

  function handleAuthSuccess(newToken: string, authenticatedUser: User) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(authenticatedUser);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  // Live profile updates syncing local state with database
  function handleProfileUpdated(updatedUser: User) {
    setUser(updatedUser);
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 gap-4">
        <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl shadow-indigo-600/15 animate-bounce">
          <Video className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h2 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight">
            Restoring HireReel Session
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wide mt-1">
            VERIFYING CRYPTOGRAPHIC TOKEN CHANNELS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative text-slate-900 dark:text-slate-100">
      
      {/* Decorative gradients and background blobs */}
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-[500px] w-full max-w-7xl mx-auto overflow-hidden opacity-30 dark:opacity-20 select-none">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-300 dark:bg-indigo-600/40 blur-3xl"></div>
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-300 dark:bg-cyan-600/40 blur-3xl"></div>
      </div>

      <Navbar user={user} onLogout={handleLogout} />

      {!token || !user ? (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      ) : user.role === "recruiter" ? (
        <RecruiterDashboard token={token} />
      ) : (
        <CandidateDashboard
          user={user}
          token={token}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Humble literal developer tag footer inside index margin */}
      <footer className="mt-auto py-8 text-center text-[11px] font-mono text-slate-400 tracking-wide border-t border-slate-200/10">
        HIRECONECT CORP • ALL PLATFORM CHANNELS LIVE • SECURED WITH JWT
      </footer>
    </div>
  );
}

import React, { useState } from "react";
import { User, Role } from "../types";
import { Sparkles, Video, Mail, Lock, UserCheck, Briefcase, Plus, Heart } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<Role>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState("");
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorLoading(null);
    setIsSubmitting(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin
      ? { email, password }
      : { name, email, password, role, skills: role === "candidate" ? skills : undefined };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed registration or authorization process.");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      console.error("Auth Fail:", err);
      setErrorLoading(err.message || "Invalid email or credentials entered. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-radial from-slate-50 to-indigo-50/20 dark:from-slate-950 dark:to-indigo-950/10">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl dark:shadow-black/40 border border-slate-100 dark:border-slate-800/80 flex flex-col p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/2">
        
        {/* Logo and Greeting */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-600/10">
            <Video className="w-6 h-6" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
            {isLogin ? "Welcome Back to HireReel" : "Join HireReel AI today"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isLogin
              ? "Sign in to manage your resume or review top applicants."
              : "Create profile, upload video resumes, and connect with top teams."}
          </p>
        </div>

        {/* Error Notification */}
        {errorLoading && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-semibold leading-relaxed">
            ⚠️ {errorLoading}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Register Mode - Name Input */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-2">
                User Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                id="inp-auth-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          )}

          {/* Email Match */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                id="inp-auth-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password Match */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-2">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                id="inp-auth-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-605 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Register Only - Role Selector and Skills */}
          {!isLogin && (
            <>
              {/* Role Toggle Button Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-2.5">
                  Choose Platform Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("candidate")}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === "candidate"
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 font-bold ring-1 ring-indigo-600/10"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 bg-white dark:bg-slate-950"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === "recruiter"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold ring-1 ring-emerald-600/10"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 bg-white dark:bg-slate-950"
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    Recruiter
                  </button>
                </div>
              </div>

              {/* Skills Area if Candidate */}
              {role === "candidate" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-2">
                    Key Technical Skills
                  </label>
                  <input
                    type="text"
                    required
                    value={skills}
                    id="inp-auth-skills"
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js, Next.js, UI/UX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                    Separator with commas (e.g. React, TypeScript) to allow accurate match scoring.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Main submit button with loading overlay */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-slate-900 dark:bg-indigo-600 border border-slate-900 dark:border-indigo-600 hover:bg-black dark:hover:bg-indigo-500 font-semibold text-slate-50 dark:text-white rounded-xl shadow-lg dark:shadow-indigo-500/10 active:scale-[0.98] transition-all text-sm mt-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isLogin ? (
              "Sign In to Dashboard"
            ) : (
              "Complete Free Registration"
            )}
          </button>
        </form>

        {/* Auth Toggle text link */}
        <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-350 transition-transform hover:scale-105 cursor-pointer"
          >
            {isLogin
              ? "Don't have an account? Create an account free"
              : "Already have a registered account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

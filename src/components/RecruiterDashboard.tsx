import React, { useState, useEffect } from "react";
import { User, Job, Application } from "../types";
import { Sparkles, Video, Briefcase, Plus, Send, RefreshCw, FileText, CheckCircle2, Search, HelpCircle, Eye, AlertCircle, TrendingUp, CheckCircle, ChevronDown, Award, ShieldCheck, Mail, Globe, MapPin, BarChart3, MessageSquare, Calendar, Link2, Trash2, Github, Linkedin } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import CandidateChatSystem from "./CandidateChatSystem";

interface RecruiterDashboardProps {
  token: string;
}

export default function RecruiterDashboard({ token }: RecruiterDashboardProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Job Post State
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobSkills, setJobSkills] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Active Recruiter State
  const [candidates, setCandidates] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingCand, setIsLoadingCand] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  
  // Advanced Search Engine parameters
  const [searchSkills, setSearchSkills] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [minMatchValue, setMinMatchValue] = useState("40");
  const [searchCandidateResults, setSearchCandidateResults] = useState<any[]>([]);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);

  // Recruiter Profile & Organisation Configurations
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyWeb, setCompanyWeb] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  // Interactive View Toggles
  const [rootTab, setRootTab] = useState<"kanban" | "search" | "org" | "chat" | "jobs_list" | "analytics">("kanban");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modifyingAppId, setModifyingAppId] = useState<string | null>(null);

  // Schedulers State variables
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [meetingURL, setMeetingURL] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Kanban Pipeline Definition States
  // Convert current pipeline into: Applied, Screening, Shortlisted, Interview, HR Round, Selected, Rejected
  const PIPELINE_COLUMNS = ["applied", "screening", "shortlisted", "interview", "hr_round", "selected", "rejected"];

  useEffect(() => {
    fetchActiveRecruiter();
    fetchCandidates();
    fetchApplications();
    triggerAdvancedCandidateSearch();
  }, []);

  async function fetchActiveRecruiter() {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        if (data) {
          setCompanyName(data.companyName || "");
          setCompanyLogo(data.companyLogo || "");
          setCompanyDesc(data.companyDescription || "");
          setCompanyWeb(data.companyWebsite || "");
          setCompanyIndustry(data.companyIndustry || "");
          setCompanyEmail(data.companyEmail || data.email);
        }
      }
    } catch (err) {
      console.error("Could not fetch recruiter metadata", err);
    }
  }

  async function fetchCandidates() {
    setIsLoadingCand(true);
    try {
      const res = await fetch("/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error("Failed to fetch candidates count", err);
    } finally {
      setIsLoadingCand(false);
    }
  }

  async function fetchApplications() {
    setIsLoadingApps(true);
    try {
      const res = await fetch("/api/applications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Failed to load applications log", err);
    } finally {
      setIsLoadingApps(false);
    }
  }

  // Publishes vacancies in database
  async function handlePublishJob(e: React.FormEvent) {
    e.preventDefault();
    setIsPublishing(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: jobTitle,
          company: jobCompany || companyName || "My Organization",
          skillsRequired: jobSkills,
          description: jobDesc
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish openings failed.");

      setFeedbackMsg(`✨ Opened job role "${jobTitle}" successfully!`);
      setJobTitle("");
      setJobCompany("");
      setJobSkills("");
      setJobDesc("");
      setTimeout(() => setFeedbackMsg(null), 3500);
      setRootTab("kanban");
    } catch (err: any) {
      alert(err.message || "Failed to publish job.");
    } finally {
      setIsPublishing(false);
    }
  }

  // Interactive update status with custom notes addition
  async function handleUpdateStatus(appId: string, status: string, customNote?: string) {
    setModifyingAppId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status, noteText: customNote })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update pipeline stage.");
      }

      const updatedRes = await res.json();
      
      setFeedbackMsg(`Pipeline status advanced to "${status}"! Timeline logged.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
      
      // Sync local applications list instantly
      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: status as any, timeline: updatedRes.application?.timeline, notes: updatedRes.application?.notes } : app))
      );
      
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: status as any, timeline: updatedRes.application?.timeline, notes: updatedRes.application?.notes } : null));
      }

      // Re-trigger candidate search to reflect verification booster changes
      triggerAdvancedCandidateSearch();
    } catch (err: any) {
      alert(err.message || "Failed to switch state.");
    } finally {
      setModifyingAppId(null);
    }
  }

  // Recruiter Search API connector
  async function triggerAdvancedCandidateSearch() {
    setIsSearchingCandidates(true);
    try {
      const res = await fetch(`/api/users/search?skills=${searchSkills}&role=${searchRole}&minScore=${minMatchValue}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchCandidateResults(data);
      }
    } catch (err) {
      console.error("Search query faulted:", err);
    } finally {
      setIsSearchingCandidates(false);
    }
  }

  // Configure recruiter organization values
  async function handleSaveOrgProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingOrg(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/users/profile/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName,
          companyDescription: companyDesc,
          companyLogo,
          companyWebsite: companyWeb,
          companyIndustry,
          companyEmail,
          isRecruiterVerified: companyEmail ? true : false
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Organization setup failed.");

      setCurrentUser(data.user);
      setFeedbackMsg("✨ Recruiter Organization Profile configured!");
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingOrg(false);
    }
  }

  // Interview Slot reservation planner
  async function handleScheduleInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApp) return;

    setIsScheduling(true);
    setFeedbackMsg(null);
    try {
      const link = meetingURL || "https://meet.google.com/hrc-reels-meet";
      const res = await fetch(`/api/applications/${selectedApp._id}/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          interviewDate: interviewDate,
          interviewTime: interviewTime,
          interviewMeetingLink: link,
          interviewStatus: "scheduled"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Auto update current selected app status
      setApplications((prev) =>
        prev.map((app) => (app._id === selectedApp._id ? { ...app, ...data.application } : app))
      );
      setSelectedApp((prev) => (prev ? { ...prev, ...data.application } : null));

      setFeedbackMsg("📅 Interview scheduled! Candidate notified on room link.");
      setInterviewDate("");
      setInterviewTime("");
      setMeetingURL("");
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to schedule slot.");
    } finally {
      setIsScheduling(false);
    }
  }

  // Compute stats for charts and Funnel visualizations
  const getAnalyticsDataset = () => {
    // Generate simple data reflecting aggregate statuses in list
    const keys = ["applied", "screening", "shortlisted", "interview", "hr_round", "selected", "rejected"];
    return keys.map((key) => ({
      name: key.toUpperCase(),
      candidates: applications.filter((app) => app.status === key).length
    }));
  };

  const getMatchedApplicantsListForColumn = (col: string) => {
    return applications.filter((app) => app.status === col);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">

      {/* Notifications bar */}
      {feedbackMsg && (
        <div className="bg-slate-900 shadow-xl text-slate-100 font-medium px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in text-sm border border-slate-800">
          <Sparkles className="w-5 h-5 animate-pulse text-yellow-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-450 px-3 py-1.5 rounded-full font-bold">
              ADMIN RECRUITER MANAGER
            </span>
            {currentUser?.isRecruiterVerified && (
              <span className="text-[10px] font-mono bg-emerald-105 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                🛡️ Verified recruiter
              </span>
            )}
          </div>
          <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white mt-2 tracking-tight">
            {companyName || "Organization Workspace"} Control Board
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Evaluate recorded video materials, configure AI Match algorithms, and message candidates.</p>
        </div>

        {/* Categories Tab selector */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-955 p-1 rounded-2xl w-full xl:w-auto">
          <button
            onClick={() => setRootTab("kanban")}
            className={`flex-1 xl:flex-none text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
              rootTab === "kanban" ? "bg-white dark:bg-slate-800 text-slate-955 dark:text-white shadow-sm" : "text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            📋 Kanban pipeline
          </button>
          <button
            onClick={() => setRootTab("search")}
            className={`flex-1 xl:flex-none text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
              rootTab === "search" ? "bg-white dark:bg-slate-800 text-slate-955 dark:text-white shadow-sm" : "text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            🔍 Advanced Search
          </button>
          <button
            onClick={() => setRootTab("analytics")}
            className={`flex-1 xl:flex-none text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
              rootTab === "analytics" ? "bg-white dark:bg-slate-800 text-slate-955 dark:text-white shadow-sm" : "text-slate-505 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setRootTab("org")}
            className={`flex-1 xl:flex-none text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
              rootTab === "org" ? "bg-white dark:bg-slate-800 text-slate-955 dark:text-white shadow-sm" : "text-slate-505 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            🏢 Organization Card
          </button>
          <button
            onClick={() => setRootTab("chat")}
            className={`flex-1 xl:flex-none text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
              rootTab === "chat" ? "bg-white dark:bg-slate-800 text-slate-955 dark:text-white shadow-sm" : "text-slate-505 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            💬 Candidate Chat
          </button>
          <button
            onClick={() => setRootTab("jobs_list")}
            className={`flex-1 xl:flex-none text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
              rootTab === "jobs_list" ? "bg-white dark:bg-slate-800 text-slate-955 dark:text-white shadow-sm" : "text-slate-505 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
            }`}
          >
            ➕ Post Vacancy
          </button>
        </div>
      </div>

      {/* VIEWPORT AREA: 1. CORE DRAG-AND-CLICK KANBAN HIRING PIPELINE */}
      {rootTab === "kanban" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* Main columns grid display */}
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-6">
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">7-Stage Kanban Roadmap</h3>
            
            {/* Horizontal Column layout */}
            <div className="flex gap-4 overflow-x-auto pb-4 max-w-full">
              {PIPELINE_COLUMNS.map((colName) => {
                const columnApps = getMatchedApplicantsListForColumn(colName);
                
                let colSubStyle = "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25";
                if (colName === "shortlisted") colSubStyle = "border-amber-100 dark:border-amber-950/40 bg-amber-50/10 dark:bg-amber-950/10";
                if (colName === "interview") colSubStyle = "border-purple-100 dark:border-purple-950/40 bg-purple-50/10 dark:bg-purple-950/10";
                if (colName === "selected") colSubStyle = "border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/10";
                if (colName === "rejected") colSubStyle = "border-red-100 dark:border-red-950/40 bg-red-50/5 dark:bg-red-950/5";

                return (
                  <div key={colName} className={`min-w-[200px] max-w-[200px] border p-3.5 rounded-2xl flex flex-col gap-3 min-h-[360px] ${colSubStyle}`}>
                    <div className="flex justify-between items-center bg-transparent px-1">
                      <span className="text-[10.5px] uppercase font-bold text-slate-700 dark:text-slate-350 tracking-wider font-mono">{colName}</span>
                      <span className="font-mono text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{columnApps.length}</span>
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto">
                      {columnApps.length === 0 ? (
                        <div className="text-center py-10 text-[10px] text-slate-400 dark:text-slate-500 italic">Empty Slot</div>
                      ) : (
                        columnApps.map((app) => {
                           const userObj = typeof app.userId === "object" ? app.userId : { name: "User", videoURL: "" };
                           const isSelected = selectedApp?._id === app._id;
                           return (
                             <div
                               key={app._id}
                               onClick={() => setSelectedApp(app)}
                               className={`p-3 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer transition text-left ${
                                 isSelected ? "border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-150 dark:ring-emerald-950/50 shadow-sm" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705"
                               }`}
                             >
                               <span className="text-[8.5px] font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded uppercase font-bold">
                                 Match: {app.aiScore}%
                               </span>
                               <h5 className="font-bold text-xs text-slate-800 dark:text-slate-205 mt-1.5 truncate">{ (userObj as any).name }</h5>
                               <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{ typeof app.jobId === "object" ? (app.jobId as any).title : "Position" }</p>
                             </div>
                           );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right portion: Evaluator scorecard controls */}
          <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-4 sticky top-28">
            {selectedApp ? (
              (() => {
                const userObj = typeof selectedApp.userId === "object" ? selectedApp.userId : { name: "User", email: "", videoURL: "", skills: [], summary: "" };
                const jobObj = typeof selectedApp.jobId === "object" ? selectedApp.jobId : { title: "Position", company: "Company" };
                const details = selectedApp.aiAnalysis ? JSON.parse(selectedApp.aiAnalysis) : null;

                return (
                  <div className="flex flex-col gap-4 animate-fade-in max-h-[640px] overflow-y-auto pr-1">
                    <div>
                      <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-full uppercase">Applicant scorecard detail</span>
                      <h4 className="font-display font-extrabold text-lg text-slate-900 dark:text-white mt-2">{(userObj as any).name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-505">Position matched: <strong className="text-indigo-600 dark:text-indigo-400">{(jobObj as any).title}</strong></p>
                    </div>

                    {/* Stream webcam review */}
                    {(userObj as any).videoURL ? (
                      <div className="aspect-video bg-black rounded-xl overflow-hidden mt-1 shadow border border-slate-200 dark:border-slate-800">
                        <video src={(userObj as any).videoURL} controls playsInline className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-950/30 mt-1">
                        No video recording uploaded by applicant yet.
                      </div>
                    )}

                    {/* AI Scoreboard summary */}
                    <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-805 rounded-2xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Gemini AI Analysis score</span>
                        <span className="font-mono font-black text-xl text-indigo-700 dark:text-indigo-400">{selectedApp.aiScore}%</span>
                      </div>
                      
                      {details && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 flex flex-col gap-2 leading-relaxed">
                          <p className="italic bg-white dark:bg-slate-950 p-3.5 rounded-lg border border-slate-100 dark:border-slate-850">&ldquo;{details.reasoning}&rdquo;</p>
                        </div>
                      )}
                    </div>

                    {/* Schedule Picker Block area */}
                    <form onSubmit={handleScheduleInterview} className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">📅 Plan & Schedule Candidate Interview</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          required
                          value={interviewDate}
                          id="inp-sch-date"
                          onChange={(e) => setInterviewDate(e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none"
                        />
                        <input
                          type="text"
                          required
                          value={interviewTime}
                          id="inp-sch-time"
                          onChange={(e) => setInterviewTime(e.target.value)}
                          placeholder="e.g. 10:00 AM EST"
                          className="px-2 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={meetingURL}
                        id="inp-sch-link"
                        onChange={(e) => setMeetingURL(e.target.value)}
                        placeholder="Zoom or Meet meeting URL link"
                        className="px-2 py-1.5 border border-slate-202 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-xs w-full focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isScheduling}
                        id="btn-sch-dispatch"
                        className="bg-indigo-600 font-bold text-white py-2 px-3 hover:bg-indigo-700 text-xs rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        {isScheduling ? "Booking..." : "Schedule slot"}
                      </button>
                    </form>

                    {/* Direct Move Pipe Controls */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono mb-2 block">Quick move to stage</span>
                      <div className="flex flex-wrap gap-1">
                        {PIPELINE_COLUMNS.map((stage) => (
                          <button
                            key={stage}
                            onClick={() => {
                              const noteTextPrompt = prompt(`Write custom interviewer note comments for advancing to "${stage}":`);
                              handleUpdateStatus(selectedApp._id, stage, noteTextPrompt || undefined);
                            }}
                            className={`text-[9.5px] px-2 py-1 border rounded-lg transition capitalize cursor-pointer font-bold ${
                              selectedApp.status === stage ? "border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : "text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                            }`}
                          >
                            {stage}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })()
            ) : (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
                <FileText className="w-8 h-8 animate-pulse text-indigo-100 dark:text-indigo-950/40" />
                <div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-white">Inspect Applicant Detail</h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Click any candidate card on the pipeline board to schedule interviews or add notes.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEWPORT AREA: 2. ADVANCED AI SEARCH ENGINE */}
      {rootTab === "search" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-fade-in">
          
          {/* Controls form */}
          <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-white">Candidate Search Filters</h4>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Filter skills tags criteria</label>
                <input
                  type="text"
                  value={searchSkills}
                  id="inp-search-crit-skills"
                  onChange={(e) => setSearchSkills(e.target.value)}
                  placeholder="e.g. React, TypeScript, Next"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl text-xs mt-1 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Title / Keyword filter</label>
                <input
                  type="text"
                  value={searchRole}
                  id="inp-search-crit-role"
                  onChange={(e) => setSearchRole(e.target.value)}
                  placeholder="e.g. Developer, Manager"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl text-xs mt-1 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">
                  <span>Min Weighted Match Score</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{minMatchValue}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minMatchValue}
                  id="inp-search-crit-match"
                  onChange={(e) => setMinMatchValue(e.target.value)}
                  className="w-full mt-2 accent-indigo-600"
                />
              </div>

              <button
                onClick={triggerAdvancedCandidateSearch}
                disabled={isSearchingCandidates}
                id="btn-search-trigger"
                className="w-full py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-500 font-semibold text-white rounded-xl shadow cursor-pointer text-xs transition border border-transparent"
              >
                {isSearchingCandidates ? "Searching Ledger..." : "Query Candidates Database"}
              </button>
            </div>
          </div>

          {/* Results dashboard */}
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col gap-5">
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Matches Rank Listing ({searchCandidateResults.length})
            </h3>

            {isSearchingCandidates && searchCandidateResults.length === 0 ? (
              <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-mono text-xs">Matching keyword matrices...</div>
            ) : searchCandidateResults.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400 dark:text-slate-500 italic">No candidates match current thresholds. Bring filters down!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {searchCandidateResults.map((c) => (
                  <div key={c._id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-300 dark:hover:border-slate-705 transition">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-black uppercase text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-900/40 px-2 py-0.5 rounded">
                          🎖️ {c.matchScore}% Match
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-805 border border-slate-200 dark:border-slate-705 px-2 py-0.5 rounded">
                          {c.rankingBadge}
                        </span>
                        {c.kycStatus === "verified" && (
                          <span className="text-[9px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 px-2 rounded font-bold border border-emerald-100/50 dark:border-emerald-900/30">🛡️ KYC Verified</span>
                        )}
                      </div>

                      <h4 className="font-display font-bold text-base text-slate-800 dark:text-white mt-2">{c.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5 max-w-[400px] line-clamp-2">&ldquo;{c.summary || "No elevators pitch compiled yet."}&rdquo;</p>
                      
                      {/* Projects Preview link */}
                      {c.projects?.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Featured links:</span>
                          <div className="flex gap-2">
                            {c.githubURL && <a href={c.githubURL} target="_blank" rel="noreferrer" className="text-indigo-650 dark:text-indigo-400 hover:underline text-[10px] font-medium"><Github className="w-3.5 h-3.5 inline mr-0.5" /> Code</a>}
                            {c.linkedinURL && <a href={c.linkedinURL} target="_blank" rel="noreferrer" className="text-indigo-650 dark:text-indigo-400 hover:underline text-[10px] font-medium"><Linkedin className="w-3.5 h-3.5 inline mr-0.5" /> Profile</a>}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                      {c.pdfResumeURL && (
                        <a
                          href={c.pdfResumeURL}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-transparent dark:bg-transparent hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          title="Open Resume File"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      
                      {c.videoURL && (
                        <a
                          href={c.videoURL}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-transparent dark:bg-transparent hover:bg-white dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-400 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          title="Watch Recorded Stream"
                        >
                          <Video className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEWPORT AREA: 3. DYNAMIC CHARTS ANALYTICS */}
      {rootTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fade-in">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="font-display font-bold text-base text-slate-800 dark:text-white">Recruiter Pipeline Funnel Density</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">Visualization of metrics across channels.</p>
              </div>
            </div>

            <div className="h-[280px] w-full mt-4 bg-slate-50/20 dark:bg-slate-950/20 rounded-2xl p-2 border border-slate-100 dark:border-slate-850">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getAnalyticsDataset()}>
                  <defs>
                    <linearGradient id="colCandidates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={9} />
                  <YAxis fontSize={9} />
                  <Tooltip />
                  <Area type="monotone" dataKey="candidates" stroke="#4f46e5" fillOpacity={1} fill="url(#colCandidates)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar display */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm md:col-span-2 flex flex-col gap-4">
            <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white">Distribution comparison charts</h4>
            <div className="h-[240px] w-full bg-slate-50/20 dark:bg-slate-950/20 rounded-2xl p-2 border border-slate-200 dark:border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAnalyticsDataset()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={9} />
                  <YAxis fontSize={9} />
                  <Tooltip />
                  <Bar dataKey="candidates" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* VIEWPORT AREA: 4. DIRECT RECRUITER TO REPRESENTATIVE CHAT PORTAL */}
      {rootTab === "chat" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Direct Candidate Messaging Hub</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Open active dialog threads to negotiate contracts or request live code briefings directly.</p>
          </div>
          <CandidateChatSystem
            currentUserId={currentUser?._id || "1"}
            currentUserRole="recruiter"
            currentUserName={currentUser?.name || "Premium Recruiter"}
            token={token}
            initialPartnerId={selectedApp ? String(typeof selectedApp.userId === "object" ? selectedApp.userId._id : selectedApp.userId) : undefined}
          />
        </div>
      )}

      {/* VIEWPORT AREA: 5. RECRUITER PROFILE & VERIFICATION */}
      {rootTab === "org" && (
        <div className="max-w-xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Organization Settings Profile</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Manage corporate brand credentials displayed to priority video applicants.</p>
            </div>
          </div>

          <form onSubmit={handleSaveOrgProfile} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  id="inp-org-name"
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company Logo URL</label>
                <input
                  type="text"
                  value={companyLogo}
                  id="inp-org-logo"
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  placeholder="https://acme.com/logo.png"
                  className="w-full px-3 py-2.5 border border-slate-205 dark:border-slate-805 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Corporate Website</label>
              <input
                type="text"
                value={companyWeb}
                id="inp-org-web"
                onChange={(e) => setCompanyWeb(e.target.value)}
                placeholder="https://acme.com"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Industry Niche</label>
              <input
                type="text"
                value={companyIndustry}
                id="inp-org-industry"
                onChange={(e) => setCompanyIndustry(e.target.value)}
                placeholder="artificial intelligence"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company verification email</label>
              <input
                type="email"
                value={companyEmail}
                id="inp-org-email"
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="recruiter@acme.com"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-955 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company profile description</label>
              <textarea
                rows={3}
                value={companyDesc}
                id="inp-org-desc"
                onChange={(e) => setCompanyDesc(e.target.value)}
                placeholder="Brief summary of company scale and visual design preferences."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-805 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-955 text-slate-900 dark:text-white resize-none focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingOrg}
              id="btn-org-save"
              className="w-full py-3 bg-slate-900 dark:bg-indigo-600 border border-slate-900 dark:border-indigo-700 hover:bg-black dark:hover:bg-indigo-500 font-semibold text-white rounded-xl shadow cursor-pointer text-xs transition"
            >
              {isUpdatingOrg ? "Syncing..." : "Sync Recruiter Organization Profile"}
            </button>
          </form>
        </div>
      )}

      {/* VIEWPORT AREA: 6. PUBLISH A VACANCY */}
      {rootTab === "jobs_list" && (
        <div className="max-w-xl mx-auto w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 mb-6 text-slate-900 dark:text-white">
            <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display font-bold text-xl">Create Job Opening Posting</h3>
          </div>

          <form onSubmit={handlePublishJob} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Job Position Title
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                id="inp-publish-role-title"
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend React Developer"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Company Name
              </label>
              <input
                type="text"
                required
                value={jobCompany}
                id="inp-publish-role-company"
                onChange={(e) => setJobCompany(e.target.value)}
                placeholder="e.g. Acme Tech Solutions"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-50s"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Skills Required (Comma separated list)
              </label>
              <input
                type="text"
                required
                value={jobSkills}
                id="inp-publish-role-skills"
                onChange={(e) => setJobSkills(e.target.value)}
                placeholder="e.g. React, TypeScript, Tailwind CSS, Next.js"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-955 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-650 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Role Description / Core Expectations
              </label>
              <textarea
                required
                rows={4}
                value={jobDesc}
                id="inp-publish-role-desc"
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Provide a summary of day-to-day responsibilities, stack tooling, and layout deliverables for candidates."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-955 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-650 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishing}
              id="btn-publish-role-dispatch"
              className="w-full py-3 bg-indigo-600 dark:bg-indigo-650 text-xs font-bold text-white rounded-xl shadow cursor-pointer hover:bg-indigo-700 dark:hover:bg-indigo-600 transition duration-150"
            >
              {isPublishing ? "Opening..." : "Publish Vacancy Opening"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

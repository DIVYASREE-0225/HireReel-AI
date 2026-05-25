import React, { useState, useEffect } from "react";
import { User, Job, Application } from "../types";
import { Sparkles, Video, Briefcase, Plus, Send, RefreshCw, FileText, CheckCircle2, Play, Edit, CloudLightning, ShieldCheck, Link2, MessageSquare } from "lucide-react";
import VideoRecorder from "./VideoRecorder";
import CandidateProfileForm from "./CandidateProfileForm";
import KYCDocumentsForm from "./KYCDocumentsForm";
import CandidateChatSystem from "./CandidateChatSystem";

interface CandidateDashboardProps {
  user: User;
  token: string;
  onProfileUpdated: (updatedUser: User) => void;
}

export default function CandidateDashboard({ user, token, onProfileUpdated }: CandidateDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"jobs" | "portfolio" | "kyc" | "chat">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isApplyingMap, setIsApplyingMap] = useState<Record<string, boolean>>({});
  const [showRecorder, setShowRecorder] = useState(false);
  const [skillsText, setSkillsText] = useState(user.skills.join(", "));
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filters to find ideal jobs
  const [searchQuery, setSearchQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  async function fetchJobs() {
    setIsLoadingJobs(true);
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to load jobs list", err);
    } finally {
      setIsLoadingJobs(false);
    }
  }

  async function fetchApplications() {
    try {
      const res = await fetch("/api/applications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Failed to fetch applications log", err);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          skills: skillsText,
          videoURL: user.videoURL
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save profile details.");
      }

      onProfileUpdated(data.user);
      setFeedbackMsg("✨ Core Profile and AI elevator summary synced successfully!");
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      console.error("Profile Edit Error:", err);
      alert(err.message || "Failed to update profile details.");
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleApply(jobId: string) {
    setIsApplyingMap((prev) => ({ ...prev, [jobId]: true }));
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Apply failed.");
      }

      setFeedbackMsg("🚀 Opp application submitted! Detailed AI suitability analysis calculated.");
      setTimeout(() => setFeedbackMsg(null), 4000);
      
      // Refresh applications register
      fetchApplications();
    } catch (err: any) {
      console.error("Apply Process Error:", err);
      alert(err.message || "Failed to submit job application.");
    } finally {
      setIsApplyingMap((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  function handleVideoRecordComplete(videoURL: string) {
    onProfileUpdated({ ...user, videoURL });
    setShowRecorder(false);
    setFeedbackMsg("🎥 Video resume saved and linked to candidate profile!");
    setTimeout(() => setFeedbackMsg(null), 3000);
  }

  const hasApplied = (jobId: string) => {
    return applications.some((app) => {
      const appJobId = typeof app.jobId === "object" ? app.jobId._id : app.jobId;
      return appJobId === jobId;
    });
  };

  const getApplicationForJob = (jobId: string) => {
    return applications.find((app) => {
      const appJobId = typeof app.jobId === "object" ? app.jobId._id : app.jobId;
      return appJobId === jobId;
    });
  };

  // Filter jobs locally based on keyword
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.skillsRequired.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Fallback or matches role
    const matchesRole = !roleQuery || job.description.toLowerCase().includes(roleQuery.toLowerCase());
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      
      {/* Dynamic header info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-3.5 py-1.5 rounded-full font-bold">
              CANDIDATE WORKSPACE
            </span>
            {user.kycStatus === "verified" && (
              <span className="text-[10px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-bold">
                🛡️ Verified Candidate
              </span>
            )}
          </div>
          <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white mt-2 tracking-tight">
            Welcome back, {user.name}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Configure your dynamic matching portfolio to attract premium hiring partners.</p>
        </div>

        {/* Categories Tab selector bar */}
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab("jobs")}
            className={`flex-1 sm:flex-none text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === "jobs"
                ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            💼 Opportunities
          </button>
          <button
            onClick={() => setActiveSubTab("portfolio")}
            className={`flex-1 sm:flex-none text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === "portfolio"
                ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            🔗 Portfolio Connect
          </button>
          <button
            onClick={() => setActiveSubTab("kyc")}
            className={`flex-1 sm:flex-none text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === "kyc"
                ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            🛡️ KYC & Identity
          </button>
          <button
            onClick={() => setActiveSubTab("chat")}
            className={`flex-1 sm:flex-none text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeSubTab === "chat"
                ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            💬 Recruiter Chat
          </button>
        </div>
      </div>

      {/* Notifications banner */}
      {feedbackMsg && (
        <div className="bg-indigo-600 shadow-lg text-white font-medium px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in text-sm border border-indigo-500">
          <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* VIEWPORT AREA: 1. CORE APPLICATIONS & JOB BOARD */}
      {activeSubTab === "jobs" && (
        <div className="flex flex-col gap-10 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Profile Summary Card */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                    My Core Competence Summary
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Email linked: {user.email}</p>
                </div>
                <button
                  onClick={() => setShowRecorder(true)}
                  className="flex items-center gap-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 p-3 rounded-xl transition cursor-pointer font-mono"
                >
                  <Video className="w-4 h-4" />
                  {user.videoURL ? "Re-record Stream" : "Record Video Pitch"}
                </button>
              </div>

              {/* Render Candidate AI Summary */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100/80 dark:border-slate-800/80 p-5 rounded-2xl font-normal text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-1">
                  ✨ Dynamic Matching summary (Computed by Gemini)
                </span>
                &ldquo;{user.summary || "Define your skills keywords below to generate your direct AI elevators statement pitch."}&rdquo;
              </div>

              {/* Skills Tags input */}
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Configure Skill tags (Comma-separated)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={skillsText}
                    id="inp-skills-editor"
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="React, TypeScript, Tailwinds, Nodes"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-500 hover:bg-black text-white font-bold text-xs py-2.5 px-4 rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingProfile ? "Saving..." : "Save tags"}
                  </button>
                </div>

                {/* Tags array preview */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.skills.map((s, idx) => (
                    <span key={idx} className="text-[10.5px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </form>
            </div>

            {/* Video Preview Card info */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full min-h-[290px]">
              <div>
                <h4 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                  <Video className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" /> Web-Camera Video Presentation
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  Video presentations give recruiters 5x higher attention rates! Give a brief introduction outlining your design process.
                </p>
              </div>

              {user.videoURL ? (
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-md mt-4">
                  <video src={user.videoURL} controls playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE STREAM
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-indigo-100 dark:border-slate-800 bg-indigo-50/10 dark:bg-slate-950/20 p-5 text-center mt-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">No Web Video resume</span>
                  <button
                    onClick={() => setShowRecorder(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer"
                  >
                    Open Live Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Jobs Board & Application tracing list */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Explore Selected Opportunities</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Apply instantly to auto-compare skill alignments and retrieve scores.</p>
              </div>

              {/* Local Filter inputs */}
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter skills..."
                  className="px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={roleQuery}
                  onChange={(e) => setRoleQuery(e.target.value)}
                  placeholder="Filter title..."
                  className="px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {isLoadingJobs ? (
              <div className="text-center py-10 text-xs text-slate-500">Checking registry...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-slate-50 text-center py-10 rounded-2xl border text-xs text-slate-400">
                No matching jobs found. Refine your keyword criteria search!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => {
                  const applied = hasApplied(job._id);
                  const app = getApplicationForJob(job._id);

                  return (
                    <div key={job._id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow transition">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono tracking-wider font-extrabold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full uppercase">
                              {job.company}
                            </span>
                            <h4 className="font-display font-bold text-base text-slate-900 dark:text-white mt-2">
                              {job.title}
                            </h4>
                          </div>
                          {applied && (
                            <span className="text-[9px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded-full uppercase">
                              APPLIED
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[44px] line-clamp-3">
                          {job.description}
                        </p>

                        <div>
                          <span className="block text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Required Competencies</span>
                          <div className="flex flex-wrap gap-1">
                            {job.skillsRequired.map((tg, idx) => (
                              <span key={idx} className="text-[9.5px] font-semibold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-350 border border-slate-100/50 dark:border-slate-800 px-2 py-0.5 rounded">
                                {tg}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-50 dark:border-slate-850 pt-4 mt-6 flex justify-between items-center bg-transparent">
                        {applied ? (
                          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-400">
                            AI Score: {app?.aiScore || 0}%
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-400">AUTHENTIC FLOW</span>
                        )}

                        <button
                          onClick={() => handleApply(job._id)}
                          disabled={applied || isApplyingMap[job._id]}
                          className={`text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer ${
                            applied
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-550 cursor-not-allowed"
                              : "bg-slate-950 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500"
                          }`}
                        >
                          {isApplyingMap[job._id] ? "Applying..." : applied ? "Applied" : "Apply Slot"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Core Pipelines Status view tracker */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Application Pipeline Progress Logs</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">All recruiter notes and interview schedule times reflect below in real-time.</p>
            </div>

            {applications.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                You haven't applied to any roles yet. Click Apply on any vacancy cards above.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {applications.map((app) => {
                  const jobObj = typeof app.jobId === "object" ? app.jobId : { title: "Position", company: "Company" };
                  const stages = ["applied", "screening", "shortlisted", "interview", "hr_round", "selected", "rejected"];
                  const isRejected = app.status === "rejected";
                  const currentIndex = stages.indexOf(app.status);

                  return (
                    <div key={app._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{(jobObj as any).company}</span>
                          <h4 className="font-display font-bold text-lg text-slate-800 dark:text-white mt-1">{(jobObj as any).title}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono mt-0.5">Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Presently"}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[10.5px] font-mono font-bold uppercase tracking-wide px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/35 text-indigo-700 dark:text-indigo-400 rounded-xl`}>
                            {app.status}
                          </span>
                          <span className="text-[10.5px] font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-3 py-1 rounded-xl text-slate-700 dark:text-slate-300 font-semibold">
                            AI Alignment: {app.aiScore}%
                          </span>
                        </div>
                      </div>

                       {/* Timeline flow chart */}
                      <div className="flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-950/30 p-4 border border-slate-250/50 dark:border-slate-800 rounded-2xl">
                        <div className="flex justify-between text-[8px] font-mono uppercase font-bold text-center text-slate-400 dark:text-slate-550 px-1">
                          {stages.filter(s => s !== "rejected" || isRejected).map((stg) => (
                            <span key={stg} className={app.status === stg ? "text-indigo-600 dark:text-indigo-400" : ""}>{stg}</span>
                          ))}
                        </div>
                        <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-visible flex justify-between items-center mt-2">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${isRejected ? 'bg-red-500' : 'bg-indigo-600'}`}
                            style={{ width: `${(Math.max(0, currentIndex) / (isRejected ? 6 : 5)) * 100}%` }}
                          />
                          {(isRejected ? stages : stages.filter(s => s !== "rejected")).map((stg, i) => {
                            const active = i <= currentIndex;
                            const isExc = i === currentIndex;
                            return (
                              <div
                                key={stg}
                                className={`z-10 w-3 h-3 rounded-full border-2 transition-all ${
                                  isExc
                                    ? isRejected ? "bg-red-500 border-red-500 ring-4 ring-red-150" : "bg-indigo-600 border-indigo-600 ring-4 ring-indigo-200"
                                    : active
                                    ? isRejected ? "bg-red-300 border-red-300" : "bg-indigo-600 border-indigo-600"
                                    : "bg-white border-slate-200"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Display Comments & Interview schedules dynamically */}
                      {((app as any).interviewMeetingLink || (app as any).notes?.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                          
                          {/* Interview slot details panel */}
                          {(app as any).interviewMeetingLink && (
                            <div className="border border-indigo-100 bg-indigo-50/30 p-4 rounded-xl flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-indigo-800 uppercase block font-mono">📅 Recruiter Interview Booking Room</span>
                              <div className="text-xs text-slate-600">
                                <p><strong>Slot Date:</strong> {new Date((app as any).interviewDate).toLocaleDateString()}</p>
                                <p><strong>Slot Time:</strong> {(app as any).interviewTime || "To be locked"}</p>
                              </div>
                              <a
                                href={(app as any).interviewMeetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg text-center mt-1"
                              >
                                Join Virtual Room
                              </a>
                            </div>
                          )}

                          {/* Personal notes/comments section */}
                          {(app as any).notes?.length > 0 && (
                            <div className="border p-4 rounded-xl bg-slate-50/30 flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">💬 Custom Recruiter Comments ledger</span>
                              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                                {(app as any).notes.map((nt: any, idx: number) => (
                                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 leading-normal">
                                    <p className="font-semibold text-slate-800">{nt.interviewer}:</p>
                                    <p className="mt-0.5 italic">&ldquo;{nt.text}&rdquo;</p>
                                    <span className="text-[9px] text-slate-400 font-mono block mt-1">{new Date(nt.date).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEWPORT AREA: 2. ADVANCED SKILLS PORTFOLIO LINKS */}
      {activeSubTab === "portfolio" && (
        <CandidateProfileForm
          user={user}
          token={token}
          onProfileUpdated={onProfileUpdated}
        />
      )}

      {/* VIEWPORT AREA: 3. KYC AND IDENTITY TASKS */}
      {activeSubTab === "kyc" && (
        <KYCDocumentsForm
          user={user}
          token={token}
          onProfileUpdated={onProfileUpdated}
        />
      )}

      {/* VIEWPORT AREA: 4. DIRECT CHAT MESSAGING INTEGRATION */}
      {activeSubTab === "chat" && (
        <CandidateChatSystem
          currentUserId={user._id}
          currentUserRole="candidate"
          currentUserName={user.name}
          token={token}
        />
      )}

      {/* Camera Recording Dialog Overlay */}
      {showRecorder && (
        <VideoRecorder
          token={token}
          onUploadSuccess={handleVideoRecordComplete}
          onClose={() => setShowRecorder(false)}
        />
      )}
    </div>
  );
}

import React, { useState } from "react";
import { User } from "../types";
import { Link2, Github, Linkedin, Award, Layout, FileText, Upload, Trash2, Plus, Download, FileUp, Sparkles, RefreshCw } from "lucide-react";

interface CandidateProfileFormProps {
  user: User & {
    githubURL?: string;
    linkedinURL?: string;
    portfolioURL?: string;
    certifications?: string[];
    projects?: Array<{ title: string; description: string; link: string }>;
    pdfResumeURL?: string;
  };
  token: string;
  onProfileUpdated: (updatedUser: any) => void;
}

export default function CandidateProfileForm({ user, token, onProfileUpdated }: CandidateProfileFormProps) {
  // Bio/Social Links state
  const [github, setGithub] = useState(user.githubURL || "");
  const [linkedin, setLinkedin] = useState(user.linkedinURL || "");
  const [portfolio, setPortfolio] = useState(user.portfolioURL || "");

  // Certification Adding state
  const [newCert, setNewCert] = useState("");
  
  // Project Adding state
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projLink, setProjLink] = useState("");

  // PDF resumption upload state
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const certifications = user.certifications || [];
  const projects = user.projects || [];

  // Base64 conversion
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload standard dynamic PDF documents.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  async function handleUploadPdf() {
    if (!pdfBase64) return;
    setUploadingPdf(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/upload-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fileBase64: pdfBase64,
          fileMime: "application/pdf"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload PDF Resume.");

      // Save resume link in profile
      const advancedRes = await fetch("/api/users/profile/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          pdfResumeURL: data.fileURL
        })
      });

      const advancedData = await advancedRes.json();
      if (!advancedRes.ok) throw new Error(advancedData.error);

      onProfileUpdated(advancedData.user);
      setPdfBase64(null);
      setFeedback("✨ PDF Resume uploaded and indexed successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to upload PDF file.");
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handleSaveLinks() {
    setSavingLinks(true);
    setFeedback(null);
    try {
      const advancedRes = await fetch("/api/users/profile/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          githubURL: github,
          linkedinURL: linkedin,
          portfolioURL: portfolio
        })
      });

      const advancedData = await advancedRes.json();
      if (!advancedRes.ok) throw new Error(advancedData.error);

      onProfileUpdated(advancedData.user);
      setFeedback("✨ Profile social credentials saved successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingLinks(false);
    }
  }

  async function handleAddCert(e: React.FormEvent) {
    e.preventDefault();
    if (!newCert.trim()) return;

    setFeedback(null);
    const updatedCerts = [...certifications, newCert.trim()];
    
    try {
      const advancedRes = await fetch("/api/users/profile/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          certifications: updatedCerts
        })
      });

      const advancedData = await advancedRes.json();
      if (!advancedRes.ok) throw new Error(advancedData.error);

      onProfileUpdated(advancedData.user);
      setNewCert("");
      setFeedback("🏆 Certification indexed correctly!");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleRemoveCert(index: number) {
    const updatedCerts = certifications.filter((_, idx) => idx !== index);
    try {
      const advancedRes = await fetch("/api/users/profile/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          certifications: updatedCerts
        })
      });

      const advancedData = await advancedRes.json();
      if (!advancedRes.ok) throw new Error(advancedData.error);

      onProfileUpdated(advancedData.user);
      setFeedback("🗑️ Certification removed.");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projTitle.trim()) return;

    setFeedback(null);
    const updatedProjects = [
      ...projects,
      {
        title: projTitle.trim(),
        description: projDesc.trim(),
        link: projLink.trim()
      }
    ];

    try {
      const advancedRes = await fetch("/api/users/profile/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          projects: updatedProjects
        })
      });

      const advancedData = await advancedRes.json();
      if (!advancedRes.ok) throw new Error(advancedData.error);

      onProfileUpdated(advancedData.user);
      setProjTitle("");
      setProjDesc("");
      setProjLink("");
      setFeedback("💻 Project added to portfolio listings!");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleRemoveProject(index: number) {
    const updatedProjects = projects.filter((_, idx) => idx !== index);
    try {
      const advancedRes = await fetch("/api/users/profile/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          projects: updatedProjects
        })
      });

      const advancedData = await advancedRes.json();
      if (!advancedRes.ok) throw new Error(advancedData.error);

      onProfileUpdated(advancedData.user);
      setFeedback("🗑️ Project removed from dashboard.");
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div id="candidate-advanced-portfolio-block" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
      
      {/* LEFT PORTION: SOCIAL LINKS & PROJECTS */}
      <div className="lg:col-span-8 flex flex-col gap-8 mb-4">
        
        {/* Bio Social Links Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Skills Portfolio Channels</h3>
          </div>

          {feedback && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-850 dark:text-indigo-300 text-xs py-2 px-4 rounded-xl border border-indigo-150 dark:border-indigo-900/35">
              {feedback}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-1.5 bg-transparent">
                <Github className="w-3.5 h-3.5" /> GitHub Profile URL
              </label>
              <input
                type="text"
                value={github}
                id="inp-port-github"
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/nick"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 text-xs focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn URL
              </label>
              <input
                type="text"
                value={linkedin}
                id="inp-port-linkedin"
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/nick"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 text-xs focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
                <Link2 className="w-3.5 h-3.5" /> Portfolio URL / Website
              </label>
              <input
                type="text"
                value={portfolio}
                id="inp-port-portfolio"
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://nickdev.com"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650 text-xs focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <button
            onClick={handleSaveLinks}
            disabled={savingLinks}
            id="btn-port-save-links"
            className="self-end bg-slate-900 dark:bg-indigo-600 border border-slate-900 dark:border-indigo-600 text-white font-bold text-xs py-2 px-5 rounded-lg hover:bg-black dark:hover:bg-indigo-500 transition cursor-pointer"
          >
            {savingLinks ? "Syncing..." : "Sync Links"}
          </button>
        </div>

        {/* Dynamic Project Portfolio Management */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Dynamic Showcased Projects</h3>
          </div>

          {/* Form to append project */}
          <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Project Title</label>
              <input
                type="text"
                required
                value={projTitle}
                id="inp-proj-title"
                onChange={(e) => setProjTitle(e.target.value)}
                placeholder="HireReel MVP"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Project Link URL</label>
              <input
                type="text"
                value={projLink}
                id="inp-proj-link"
                onChange={(e) => setProjLink(e.target.value)}
                placeholder="https://myproject.com"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none"
              />
            </div>
            <div className="md:col-span-1 flex flex-col justify-end">
              <button
                type="submit"
                id="btn-proj-add"
                className="bg-indigo-600 text-white hover:bg-indigo-700 py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>
            <div className="md:col-span-3 mt-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Project Description / Tech Stack</label>
              <input
                type="text"
                required
                value={projDesc}
                id="inp-proj-desc"
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="Built with React 19, Socket.IO, and Gemini analysis model."
                className="w-full px-2 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-805 dark:text-slate-200 text-xs rounded-xl focus:outline-none"
              />
            </div>
          </form>

          {/* List existing projects */}
          <div className="flex flex-col gap-3 mt-1">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">No showcased projects added. Append one above!</p>
            ) : (
              projects.map((proj, idx) => (
                <div key={idx} className="p-4 border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                      {proj.title}
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-indigo-605 dark:text-indigo-400 hover:underline inline-flex items-center text-[10px]">
                          <Link2 className="w-3 h-3" /> Visit code
                        </a>
                      )}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed truncate">{proj.description}</p>
                  </div>

                  <button
                    onClick={() => handleRemoveProject(idx)}
                    id={`btn-proj-remove-${idx}`}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-650 dark:hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT PORTION: CERTIFICATIONS & PDF RESUME */}
      <div className="lg:col-span-4 flex flex-col gap-8 mb-4">
        
        {/* PDF Resume Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white">Certified PDF Resume</h4>
          </div>

          {user.pdfResumeURL ? (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block uppercase truncate max-w-[140px]">{user.name}_Resume.pdf</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <a
                  href={user.pdfResumeURL}
                  download
                  referrerPolicy="no-referrer"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Preview File
                </a>
                <label className="flex items-center justify-center gap-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5" /> Reupload
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfChange}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50/30 dark:bg-slate-950/20">
                <Upload className="w-5 h-5 text-slate-450 dark:text-slate-505" />
                <span className="text-xs font-semibold text-slate-655 dark:text-slate-400 mt-1 block">Choose PDF resume</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handlePdfChange}
                />
              </label>
            </div>
          )}

          {pdfBase64 && (
            <button
              onClick={handleUploadPdf}
              disabled={uploadingPdf}
              id="btn-upload-pdf"
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-xs font-semibold transition flex justify-center items-center gap-1.5 mt-2"
            >
              {uploadingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify and Save PDF"}
            </button>
          )}
        </div>

        {/* Certifications Card list */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-display font-bold text-sm text-slate-805 dark:text-white">My Certifications</h4>
          </div>

          <form onSubmit={handleAddCert} className="flex gap-2">
            <input
              type="text"
              required
              value={newCert}
              id="inp-cert-text"
              onChange={(e) => setNewCert(e.target.value)}
              placeholder="e.g. AWS Cloud Associate"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              id="btn-cert-add"
              className="bg-slate-900 dark:bg-indigo-600 text-white rounded-xl py-2 px-3 hover:bg-black dark:hover:bg-indigo-500 transition cursor-pointer font-bold text-xs"
            >
              Add
            </button>
          </form>

          <div className="flex flex-col gap-2 mt-2">
            {certifications.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No credentials logged yet.</p>
            ) : (
              certifications.map((cert, index) => (
                <div key={index} className="flex justify-between items-center p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate max-w-[170px]">{cert}</span>
                  <button
                    onClick={() => handleRemoveCert(index)}
                    id={`btn-cert-remove-${index}`}
                    className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { createServer as createViteServer } from "vite";
import { connectDB, dbService, MessageModel, localData } from "./backend/db.js";
import { analyzeJobMatch, generateCandidateSummary } from "./backend/gemini.js";

const app = express();
const PORT = 3000;

// Setup middlewares
app.use(cors());
// Set payload upload limits to handle base64 video resume uploads (max 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Ensure uploads directory exists for file fallback video uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Initialize JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "hirereel_ai_secure_jwt_token_secret_key";

// Lazy initialize Cloudinary
let isCloudinaryConfigured = false;
function initCloudinary() {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      isCloudinaryConfigured = true;
      console.log("🌸 Cloudinary config loaded successfully");
    } catch (err) {
      console.error("⚠️ Failed to configure Cloudinary:", err);
      isCloudinaryConfigured = false;
    }
  } else {
    isCloudinaryConfigured = false;
  }
}

// Global user authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
}

// Connect Database on Startup
connectDB();
initCloudinary();

// ==========================================
// 🌐 AUTH ENDPOINTS
// ==========================================

// POST /api/auth/register
app.post("/api/auth/register", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { name, email, password, role, skills } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required." });
    }

    if (role !== "candidate" && role !== "recruiter") {
      return res.status(400).json({ error: "Invalid role specified. Must be 'candidate' or 'recruiter'" });
    }

    const existingUser = await dbService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Parse skills (expects comma separated or array)
    let processedSkills: string[] = [];
    if (skills) {
      processedSkills = Array.isArray(skills)
        ? skills
        : skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    // Generate simulated/AI summary if candidate
    let summary = "";
    if (role === "candidate") {
      summary = await generateCandidateSummary(name, processedSkills);
    }

    const newUser = await dbService.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      skills: processedSkills,
      videoURL: "",
      summary
    });

    // Create Token
    const token = jwt.sign({ id: newUser._id, role: newUser.role, email: newUser.email }, JWT_SECRET, {
      expiresIn: "7d"
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      message: "Registration successful!",
      token,
      user: userWithoutPassword
    });
  } catch (err: any) {
    console.error("Register Error:", err);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await dbService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Create Token
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: "7d"
    });

    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({
      message: "Login successful!",
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Internal server error during login." });
  }
});

// GET /api/auth/me (Recover user from token)
app.get("/api/auth/me", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await dbService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User session not found." });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: "Authentication recovery token failed" });
  }
});


// ==========================================
// 🙋 USER CANDIDATE ENDPOINTS
// ==========================================

// GET /api/users (Candidates viewing for Recruiters)
app.get("/api/users", authenticateToken, async (req: any, res: any) => {
  try {
    // Only recruiters can pull database of candidates
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Forbidden. Access is restricted to recruiters only." });
    }

    const allUsers = await dbService.getAllUsers();
    // Filter to only candidate users of HireReel platform
    const candidates = allUsers.filter(u => u.role === "candidate");
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch candidates." });
  }
});

// GET /api/users/:id
app.get("/api/users/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await dbService.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }
    const { password: _, ...sansPassword } = user;
    res.json(sansPassword);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch candidate profile." });
  }
});

// POST /api/users/profile (Update skills & description for Candidate)
app.post("/api/users/profile", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ error: "Only candidate users can update candidate profile information." });
    }

    const { skills, videoURL } = req.body;
    
    let processedSkills: string[] = [];
    if (skills) {
      processedSkills = Array.isArray(skills)
        ? skills
        : skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    // Refresh name reference
    const userObj = await dbService.findUserById(req.user.id);
    if (!userObj) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    // Recalculate AI Candidate Summary dynamically!
    const updatedSummary = await generateCandidateSummary(userObj.name, processedSkills, videoURL || userObj.videoURL);

    const updatedUser = await dbService.updateCandidateProfile(req.user.id, {
      skills: processedSkills,
      videoURL: videoURL !== undefined ? videoURL : userObj.videoURL,
      summary: updatedSummary
    });

    const { password: _, ...sansPassword } = updatedUser as any;
    res.json({
      message: "Candidate profile updated successfully!",
      user: sansPassword
    });
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ error: "Internal error updating candidate profile." });
  }
});


// ==========================================
// 💼 JOB POSTING ENDPOINTS
// ==========================================

// GET /api/jobs (Fetch jobs available for candidates to apply)
app.get("/api/jobs", async (req: express.Request, res: express.Response) => {
  try {
    const jobs = await dbService.getAllJobs();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job list." });
  }
});

// POST /api/jobs (Created by recruiters)
app.post("/api/jobs", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Only recruiter users can publish new job listings." });
    }

    const { title, company, skillsRequired, description } = req.body;

    if (!title || !company || !skillsRequired) {
      return res.status(400).json({ error: "Job title, company and skillsRequired are required." });
    }

    let processedSkills: string[] = [];
    if (skillsRequired) {
      processedSkills = Array.isArray(skillsRequired)
        ? skillsRequired
        : skillsRequired.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const newJob = await dbService.createJob({
      title,
      company,
      skillsRequired: processedSkills,
      description: description || ""
    });

    res.status(201).json({
      message: "Job posting created successfully!",
      job: newJob
    });
  } catch (err) {
    console.error("Create Job Error:", err);
    res.status(500).json({ error: "Failed to publish job." });
  }
});


// ==========================================
// 📝 JOB APPLICATION ENDPOINTS
// ==========================================

// POST /api/apply (Candidate applying to a job)
app.post("/api/apply", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ error: "Only candidates can apply to job listings." });
    }

    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required to apply." });
    }

    // Verify candidate exists
    const candidate = await dbService.findUserById(req.user.id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found." });

    // Verify job exists
    const job = await dbService.findJobById(jobId);
    if (!job) return res.status(404).json({ error: "Job posting does not exist." });

    console.log(`Calculating AI Match for candidate ${candidate.name} and job ${job.title}...`);

    // Perform AI Analysis matching using Gemini AI Service!
    const aiAnalysisResult = await analyzeJobMatch(
      candidate.name,
      candidate.skills,
      job.title,
      job.company,
      job.skillsRequired,
      job.description || ""
    );

    // Save Application with status 'applied' and calculated AI scoring!
    const application = await dbService.createApplication({
      userId: candidate._id,
      jobId: job._id,
      status: "applied",
      aiScore: aiAnalysisResult.score,
      aiAnalysis: JSON.stringify(aiAnalysisResult) // Store complete analysis object as JSON
    });

    res.status(201).json({
      message: "Application submitted successfully!",
      application
    });
  } catch (err) {
    console.error("Apply Error:", err);
    res.status(500).json({ error: "Failed to submit job application." });
  }
});

// GET /api/applications (Fetch candidate's application logs, or ALL applications for Recruiters)
app.get("/api/applications", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role === "recruiter") {
      // Recruiters get comprehensive matching ledger
      const allApps = await dbService.getAllApplications();
      return res.json(allApps);
    } else {
      // Candidates get restricted list of active registrations
      const candidateApps = await dbService.getApplicationsByCandidate(req.user.id);
      return res.json(candidateApps);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve job applications." });
  }
});

// POST /api/applications/:id/status (Recruiter shortlists/advances the candidate in the hiring pipeline)
app.post("/api/applications/:id/status", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Forbidden. Only Recruiters can manage candidate statuses." });
    }

    const { status, noteText } = req.body;
    const { id } = req.params;

    const validStatuses = ["applied", "screening", "shortlisted", "interview", "hr_round", "selected", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    // Retrieve active app details
    const apps = await dbService.getAllApplications();
    const targetApp = apps.find(a => String(a._id) === String(id));
    let currentTimeline = [];
    let currentNotes = [];
    if (targetApp) {
      currentTimeline = Array.isArray(targetApp.timeline) ? targetApp.timeline : [];
      currentNotes = Array.isArray(targetApp.notes) ? targetApp.notes : [];
    }

    const updatedTimeline = [
      ...currentTimeline,
      {
        stage: status,
        updatedBy: "Recruiter Account",
        date: new Date()
      }
    ];

    if (noteText) {
      currentNotes.push({
        text: noteText,
        date: new Date(),
        interviewer: "Primary Recruiter"
      });
    }

    const updatedApp = await dbService.updateApplicationDetails(id, {
      status,
      timeline: updatedTimeline,
      notes: currentNotes
    });

    if (!updatedApp) {
      return res.status(404).json({ error: "Application tracking record not found." });
    }

    res.json({
      message: `Applicant status set to ${status} successfully!`,
      application: updatedApp
    });
  } catch (err) {
    console.error("Pipeline advance error:", err);
    res.status(500).json({ error: "Failed to change candidate application state." });
  }
});


// ==========================================
// 📄 DOCUMENT & PICTURE FILE UPLOAD SERVICE
// ==========================================

// Handles base64 resume / KYC document / selfie uploads (resilient to Cloudinary vs Local Storage fallback)
app.post("/api/upload-file", authenticateToken, async (req: any, res: any): Promise<any> => {
  try {
    const { fileBase64, fileMime } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: "Missing file payload content." });
    }

    // Clean base64 encodings
    const cleanBase64 = fileBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, "");
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    const extension = fileMime === "application/pdf" ? ".pdf" : ".jpg";
    const savedName = `doc_${req.user.id}_${Date.now()}${extension}`;
    const localPath = path.join(uploadsDir, savedName);

    // Write locally for resilient fallback first
    fs.writeFileSync(localPath, fileBuffer);
    const localRelPath = `/uploads/${savedName}`;

    if (isCloudinaryConfigured) {
      try {
        console.log("☁️ Uploading document/picture resource to Cloudinary...");
        // PDF is a raw or standard upload type
        const resType = fileMime === "application/pdf" ? "raw" : "image";
        const cloudResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            localPath,
            { resource_type: resType, folder: "hirereel_docs" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });

        // Safe cleanup
        fs.unlinkSync(localPath);
        return res.json({
          message: "Uploaded to Cloudinary successfully!",
          fileURL: (cloudResult as any).secure_url
        });
      } catch (cloudinaryErr) {
        console.error("⚠️ Cloudinary upload faulted. Falling back to static backend hosting.", cloudinaryErr);
      }
    }

    const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
    return res.json({
      message: "Uploaded to local storage environment success.",
      fileURL: `${appUrl}${localRelPath}`
    });
  } catch (err) {
    console.error("File upload failed:", err);
    res.status(500).json({ error: "Unsuccessful file process." });
  }
});


// ==========================================
// 🙋 USER PROFILE & SETTINGS
// ==========================================

// PUT/POST /api/users/profile/advanced
app.post("/api/users/profile/advanced", authenticateToken, async (req: any, res: any): Promise<any> => {
  try {
    const updatedUser = await dbService.updateUserProfile(req.user.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ error: "Could not find profile session." });
    }

    res.json({
      message: "Profile configured successfully!",
      user: updatedUser
    });
  } catch (err) {
    console.error("Profile updates faulted:", err);
    res.status(500).json({ error: "Internal profile update fail." });
  }
});


// ==========================================
// 🔍 RECRUITER ADVANCED CANDIDATE SEARCH ENGINE
// ==========================================

// GET /api/users/search (Supports sorting, keyword weights, min score filters)
app.get("/api/users/search", authenticateToken, async (req: any, res: any): Promise<any> => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Forbidden. Candidate registry search requires Recruiter privileges." });
    }

    const { skills, role, minScore, searchVal } = req.query;

    const allUsers = await dbService.getAllUsers();
    const candidates = allUsers.filter(u => u.role === "candidate");

    const skillsFilter = skills
      ? String(skills).split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];
    const roleFilter = role ? String(role).trim().toLowerCase() : "";
    const minMatchScore = minScore ? parseInt(String(minScore), 10) || 0 : 0;
    const generalSearch = searchVal ? String(searchVal).trim().toLowerCase() : "";

    const scoredCandidates = candidates.map(c => {
      let score = 50; // Base score
      const candidateSkills = (c.skills || []).map((s: string) => s.toLowerCase());

      // 1. Core Weighted Skill Scoring Overlap
      if (skillsFilter.length > 0) {
        let matchedSkills = 0;
        skillsFilter.forEach(sf => {
          if (candidateSkills.some((cs: string) => cs.includes(sf) || sf.includes(cs))) {
            matchedSkills++;
          }
        });
        const ratio = matchedSkills / skillsFilter.length;
        score = Math.round(score + (ratio * 35));
      } else {
        score = Math.min(95, Math.max(50, score + (c.skills?.length || 0) * 4));
      }

      // 2. Keyword Similarity Alignment Overlay (Roles matching)
      if (roleFilter) {
        const candidateSummary = (c.summary || "").toLowerCase();
        const hasRoleInSummary = candidateSummary.includes(roleFilter);
        const hasRoleInSkills = candidateSkills.some((cs: string) => cs.includes(roleFilter));
        
        if (hasRoleInSummary || hasRoleInSkills) {
          score = Math.min(100, score + 15);
        } else {
          score = Math.max(15, score - 8);
        }
      }

      // Booster metrics (Verification badges)
      if (c.videoURL) score = Math.min(100, score + 10);
      if (c.kycStatus === "verified") score = Math.min(100, score + 5);

      score = Math.min(100, Math.max(0, score));

      // Calculate ranking badge tiers
      let badge = "Silver Contender";
      if (score >= 85) badge = "Elite Scholar";
      else if (score >= 70) badge = "Gold Veteran";
      else if (score >= 55) badge = "Pro Candidate";

      return {
        ...c,
        matchScore: score,
        rankingBadge: badge
      };
    });

    // Apply Filter Criteria
    let filtered = scoredCandidates.filter(c => {
      if (c.matchScore < minMatchScore) return false;

      if (generalSearch) {
        const matchesName = (c.name || "").toLowerCase().includes(generalSearch);
        const matchesSummary = (c.summary || "").toLowerCase().includes(generalSearch);
        const matchesSkills = (c.skills || []).some((s: string) => s.toLowerCase().includes(generalSearch));
        return matchesName || matchesSummary || matchesSkills;
      }
      return true;
    });

    // Rank candidate matching descendingly
    filtered.sort((a, b) => b.matchScore - a.matchScore);

    res.json(filtered);
  } catch (err) {
    console.error("Candidate listing search failed:", err);
    res.status(500).json({ error: "Failed to search candidate profile ledger." });
  }
});


// ==========================================
// 💬 REAL-TIME CHAT CHANNELS
// ==========================================

// GET /api/messages/:otherId (Fetch dialogue between users)
app.get("/api/messages/:otherId", authenticateToken, async (req: any, res: any) => {
  try {
    const thread = await dbService.getConversation(req.user.id, req.params.otherId);
    res.json(thread);
  } catch (err) {
    res.status(500).json({ error: "Could not restore conversation history." });
  }
});

// POST /api/messages
app.post("/api/messages", authenticateToken, async (req: any, res: any) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ error: "Unidentified chat parameters." });
    }

    const message = await dbService.createMessage({
      senderId: req.user.id,
      receiverId,
      content
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Could not finalize chat transmission." });
  }
});

// GET /api/messages/partners/convo
app.get("/api/messages/partners/convo", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    let convoList: any[] = [];
    
    if (dbService.isMongo()) {
      // Fetch dynamic populating dialog entries in Mongo
      const messages = await MessageModel.find({
        $or: [{ senderId: userId }, { receiverId: userId }]
      })
      .sort({ createdAt: -1 })
      .populate("senderId receiverId", "name email role kycStatus isRecruiterVerified phone")
      .lean();

      const map = new Map();
      messages.forEach((m: any) => {
        const otherUser = String(m.senderId._id) === String(userId) ? m.receiverId : m.senderId;
        const oId = String(otherUser._id);
        if (!map.has(oId)) {
          map.set(oId, {
            user: otherUser,
            lastMessage: m.content,
            createdAt: m.createdAt,
            isRead: m.isRead || false
          });
        }
      });
      convoList = Array.from(map.values());
    } else {
      // Database Local File simulation fallback
      const messages = (localData.messages || [])
        .filter(m => String(m.senderId) === String(userId) || String(m.receiverId) === String(userId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const map = new Map();
      messages.forEach(m => {
        const otherId = String(m.senderId) === String(userId) ? m.receiverId : m.senderId;
        const otherUser = localData.users.find(u => String(u._id) === String(otherId)) || { _id: otherId, name: "Deleted User", email: "", role: "candidate" };
        const { password, ...sansPw } = otherUser;
        if (!map.has(otherId)) {
          map.set(otherId, {
            user: sansPw,
            lastMessage: m.content,
            createdAt: m.createdAt,
            isRead: m.isRead || false
          });
        }
      });
      convoList = Array.from(map.values());
    }

    res.json(convoList);
  } catch (err) {
    console.error("Partners Convo registry error:", err);
    res.status(500).json({ error: "Could not compile list of dialog contacts." });
  }
});


// ==========================================
// 📅 CLASSIFIED INTERVIEW APPOINTMENTS
// ==========================================

// POST /api/applications/:id/details
app.post("/api/applications/:id/details", authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updated = await dbService.updateApplicationDetails(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Application tracking indices not matching." });
    }

    res.json({
      message: "Application detailed parameters matched successfully!",
      application: updated
    });
  } catch (err) {
    res.status(500).json({ error: "Could not configure interview booking metrics." });
  }
});


// ==========================================
// 🎥 VIDEO UPLOAD SERVICE
// ==========================================

// Handles base64 video resume uploads from frontend webcam recording.
// Provides automated local saving directory or handles Cloudinary upload stream.
app.post("/api/upload-video", authenticateToken, async (req: any, res: any): Promise<any> => {
  try {
    const { videoBase64 } = req.body;
    if (!videoBase64) {
      return res.status(400).json({ error: "No video resume data received." });
    }

    // Clean base64 encoding headers if present
    const base64Clean = videoBase64.replace(/^data:video\/[a-zA-Z0-9]+;base64,/, "");
    const videoBuffer = Buffer.from(base64Clean, "base64");

    const fileName = `resume_${req.user.id}_${Date.now()}.webm`;
    const localFilePath = path.join(uploadsDir, fileName);

    // Save locally first (resilient file-fallback requirement)
    fs.writeFileSync(localFilePath, videoBuffer);
    const localAccessUrl = `/uploads/${fileName}`;

    console.log(`Video recorded. Backing up locally to: ${localFilePath}`);

    // If Cloudinary is configured, load to Cloudinary and stream it up!
    if (isCloudinaryConfigured) {
      console.log("🌸 Uploading custom video resume stream to Cloudinary...");
      try {
        const cloudResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            localFilePath,
            { resource_type: "video", folder: "hirereel_resumes" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });

        // Delete local temporary file
        fs.unlinkSync(localFilePath);

        const secureUrl = (cloudResult as any).secure_url;
        console.log("☁️ Cloudinary Upload Success:", secureUrl);

        // Auto-save this URL inside candidate profile!
        await dbService.updateCandidateProfile(req.user.id, {
          skills: [], // Only updates videoURL by keeping original skills
          videoURL: secureUrl
        });

        return res.json({
          message: "Video resume uploaded to Cloudinary successfully!",
          videoURL: secureUrl
        });
      } catch (cloudinaryErr) {
        console.error("⚠️ Cloudinary upload stream failed. Defaulting to local static server url.", cloudinaryErr);
        // Fallback gracefully to the local address we created
      }
    }

    // Default Fallback: Static express hosted path relative to host
    const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
    const fullLocalUrl = `${appUrl}${localAccessUrl}`;

    console.log(`Returning hosted file path: ${fullLocalUrl}`);

    // Update candidate profile
    const userObj = await dbService.findUserById(req.user.id);
    await dbService.updateCandidateProfile(req.user.id, {
      skills: userObj?.skills || [],
      videoURL: fullLocalUrl
    });

    return res.json({
      message: "Video resume saved locally on server environment.",
      videoURL: fullLocalUrl
    });
  } catch (err) {
    console.error("Video Upload Error:", err);
    return res.status(500).json({ error: "Failed to process video resume upload." });
  }
});


// ==========================================
// 🛠️ VITE MIDDLEWARE & CLIENT FALLBACK
// ==========================================
async function startServer() {
  await connectDB(); // trigger database initialization

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected to Socket.IO session ID:", socket.id);
    
    socket.on("join_room", (userId) => {
      socket.join(String(userId));
      console.log(`👥 Joined chat channel/room ID: ${userId}`);
    });

    socket.on("send_message", (data) => {
      // Broadcast chat message
      io.to(String(data.receiverId)).emit("receive_message", data);
      io.to(String(data.receiverId)).emit("notification", {
        type: "chat",
        senderId: data.senderId,
        message: `${data.senderName || "Recruiter"} sent you a message!`
      });
    });

    socket.on("status_change", (data) => {
      // Broadcast state progress updates to user
      io.to(String(data.candidateId)).emit("notification", {
        type: "pipeline",
        applicationId: data.applicationId,
        message: `Your application status at HireReel was changed to: ${data.status}`
      });
    });

    socket.on("disconnect", () => {
      console.log("🔌 User disconnected from Socket.IO");
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 HireReel AI server running at: http://localhost:${PORT}`);
    console.log(`   Database Status: ${dbService.isMongo() ? "Atlas MongoDB" : "File System DB"}`);
  });
}

startServer();

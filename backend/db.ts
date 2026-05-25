import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Initialize MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI || "";
export let isConnectedToMongo = false;

// We'll define schemas for Mongoose
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["candidate", "recruiter"], default: "candidate" },
  skills: { type: [String], default: [] },
  videoURL: { type: String, default: "" },
  summary: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  
  // KYC Validation
  kycStatus: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
  kycAadhaarPANFile: { type: String, default: "" },
  kycSelfieFile: { type: String, default: "" },
  
  // Identity & Badges
  phone: { type: String, default: "" },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  
  // PDF resume
  pdfResumeURL: { type: String, default: "" },
  
  // Skills Portfolio
  githubURL: { type: String, default: "" },
  linkedinURL: { type: String, default: "" },
  portfolioURL: { type: String, default: "" },
  certifications: { type: [String], default: [] },
  projects: {
    type: [{
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      link: { type: String, default: "" }
    }],
    default: []
  },

  // Recruiter & Organisation Settings
  isRecruiterVerified: { type: Boolean, default: false },
  companyEmail: { type: String, default: "" },
  isCompanyEmailVerified: { type: Boolean, default: false },
  companyLogo: { type: String, default: "" },
  companyDescription: { type: String, default: "" },
  companyWebsite: { type: String, default: "" },
  companyIndustry: { type: String, default: "" },
  hiringRoles: { type: [String], default: [] }
});

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  skillsRequired: { type: [String], default: [] },
  description: { type: String, default: "" },
  location: { type: String, default: "Remote" }, // added location filter field
  role: { type: String, default: "Developer" }, // added role filter field
  createdAt: { type: Date, default: Date.now }
});

const ApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  status: {
    type: String,
    enum: ["applied", "screening", "shortlisted", "interview", "hr_round", "selected", "rejected"],
    default: "applied"
  },
  aiScore: { type: Number, default: 0 },
  aiAnalysis: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  
  // Notes & Timeline logs
  notes: {
    type: [{
      text: { type: String, default: "" },
      date: { type: Date, default: Date.now },
      interviewer: { type: String, default: "" }
    }],
    default: []
  },
  timeline: {
    type: [{
      stage: { type: String, default: "" },
      updatedBy: { type: String, default: "" },
      date: { type: Date, default: Date.now }
    }],
    default: []
  },
  
  // Interview Booking Slot Details
  interviewDate: { type: Date, default: null },
  interviewTime: { type: String, default: "" },
  interviewMeetingLink: { type: String, default: "" },
  interviewStatus: {
    type: String,
    enum: ["pending", "scheduled", "completed", "cancelled"],
    default: "pending"
  }
});

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export let UserModel: mongoose.Model<any>;
export let JobModel: mongoose.Model<any>;
export let ApplicationModel: mongoose.Model<any>;
export let MessageModel: mongoose.Model<any>;

// Helper for local file-based fallback database
const FALLBACK_FILE = path.join(process.cwd(), "db_fallback.json");

interface FallbackDB {
  users: any[];
  jobs: any[];
  applications: any[];
  messages: any[];
}

export let localData: FallbackDB = {
  users: [],
  jobs: [],
  applications: [],
  messages: []
};

function loadLocalDB() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, "utf-8");
      localData = JSON.parse(raw);
    } else {
      // Seed default jobs
      localData = {
        users: [],
        jobs: [
          {
            _id: "job_1",
            title: "Frontend React Developer",
            company: "TechVibe AI",
            skillsRequired: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
            description: "We are looking for a video-first candidate to craft stunning visual user interfaces and seamless responsive web screens.",
            createdAt: new Date()
          },
          {
            _id: "job_2",
            title: "Full Stack Node.js Engineer",
            company: "SaaSify",
            skillsRequired: ["Node.js", "Express", "MongoDB", "REST APIs", "TypeScript"],
            description: "Join our core team to scale REST endpoints and optimize database schemas. Must have backend experience and clean architectural understanding.",
            createdAt: new Date()
          },
          {
            _id: "job_3",
            title: "AI & Machine Learning Lead",
            company: "InnoFuture",
            skillsRequired: ["Python", "TensorFlow", "Gemini API", "PyTorch", "LLMs"],
            description: "Looking for an expert to implement generative AI pipelines and vector searches to deliver smart bento grid analytics panels.",
            createdAt: new Date()
          }
        ],
        applications: [],
        messages: []
      };
      saveLocalDB();
    }
  } catch (err) {
    console.error("Failed to load local fallback DB:", err);
  }
}

function saveLocalDB() {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(localData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local fallback DB:", err);
  }
}

// Attempt Mongoose connection lazily or at start up
export async function connectDB() {
  const isPlaceholder = !MONGODB_URI || MONGODB_URI.includes("map-database-atlas-uri") || !MONGODB_URI.startsWith("mongodb");

  if (!isPlaceholder) {
    try {
      mongoose.set("strictQuery", false);
      console.log("🔌 Attempting to connect to MongoDB Atlas...");
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 2000
      });
      isConnectedToMongo = true;
      console.log("🚀 MONGODB CONNECTED SUCCESSFULLY TO ATLAS");
      
      UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
      JobModel = mongoose.models.Job || mongoose.model("Job", JobSchema);
      ApplicationModel = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
      MessageModel = mongoose.models.Message || mongoose.model("Message", MessageSchema);

      // Seed default jobs into MongoDB if empty
      const jobCount = await JobModel.countDocuments();
      if (jobCount === 0) {
        await JobModel.insertMany([
          {
            title: "Frontend React Developer",
            company: "TechVibe AI",
            skillsRequired: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
            description: "We are looking for a video-first candidate to craft stunning visual user interfaces and seamless responsive web screens."
          },
          {
            title: "Full Stack Node.js Engineer",
            company: "SaaSify",
            skillsRequired: ["Node.js", "Express", "MongoDB", "REST APIs", "TypeScript"],
            description: "Join our core team to scale REST endpoints and optimize database schemas. Must have backend experience and clean architectural understanding."
          },
          {
            title: "AI & Machine Learning Lead",
            company: "InnoFuture",
            skillsRequired: ["Python", "TensorFlow", "Gemini API", "PyTorch", "LLMs"],
            description: "Looking for an expert to implement generative AI pipelines and vector searches to deliver smart bento grid analytics panels."
          }
        ]);
        console.log("Seeded default jobs in MongoDB Atlas.");
      }
    } catch (error: any) {
      console.log(`⚠️ MongoDB connection unsuccessful (e.g. Atlas IP Whitelist restriction or network timeout).`);
      console.log(`💬 Detail: ${error.message || error}`);
      console.log("ℹ️ Defaulting gracefully to high-performance local file backup storage (db_fallback.json).");
      isConnectedToMongo = false;
      loadLocalDB();
    }
  } else {
    console.log("ℹ️ MongoDB URI is unconfigured or using placeholder. Running in Offline Local Mode with file database (db_fallback.json).");
    isConnectedToMongo = false;
    loadLocalDB();
  }
}

// API abstraction layers - supports transparent MongoDB Atlas OR Local JSON File Storage fallback
export const dbService = {
  isMongo: () => isConnectedToMongo,

  // --- USER API ---
  async createUser(data: any) {
    if (isConnectedToMongo) {
      const user = new UserModel(data);
      return await user.save();
    } else {
      const _id = "user_" + Math.random().toString(36).substr(2, 9);
      const newUser = { _id, ...data, skills: data.skills || [], videoURL: data.videoURL || "", summary: data.summary || "", createdAt: new Date() };
      localData.users.push(newUser);
      saveLocalDB();
      return newUser;
    }
  },

  async findUserByEmail(email: string) {
    if (isConnectedToMongo) {
      return await UserModel.findOne({ email }).lean();
    } else {
      return localData.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async findUserById(id: string) {
    if (isConnectedToMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await UserModel.findById(id).lean();
    } else {
      return localData.users.find(u => u._id === id) || null;
    }
  },

  async getAllUsers() {
    if (isConnectedToMongo) {
      return await UserModel.find().select("-password").lean();
    } else {
      return localData.users.map(({ password, ...rest }) => rest);
    }
  },

  async updateCandidateProfile(id: string, update: { skills: string[]; videoURL?: string; summary?: string }) {
    if (isConnectedToMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await UserModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    } else {
      const index = localData.users.findIndex(u => u._id === id);
      if (index !== -1) {
        localData.users[index] = { ...localData.users[index], ...update };
        saveLocalDB();
        return localData.users[index];
      }
      return null;
    }
  },

  // --- JOB API ---
  async createJob(data: any) {
    if (isConnectedToMongo) {
      const job = new JobModel(data);
      return await job.save();
    } else {
      const _id = "job_" + Math.random().toString(36).substr(2, 9);
      const newJob = { _id, ...data, skillsRequired: data.skillsRequired || [], description: data.description || "", createdAt: new Date() };
      localData.jobs.push(newJob);
      saveLocalDB();
      return newJob;
    }
  },

  async getAllJobs() {
    if (isConnectedToMongo) {
      return await JobModel.find().lean();
    } else {
      return localData.jobs;
    }
  },

  async findJobById(id: string) {
    if (isConnectedToMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await JobModel.findById(id).lean();
    } else {
      return localData.jobs.find(j => j._id === id) || null;
    }
  },

  // --- APPLICATION API ---
  async createApplication(data: { userId: string; jobId: string; status?: string; aiScore?: number; aiAnalysis?: string }) {
    if (isConnectedToMongo) {
      const app = new ApplicationModel({
        userId: new mongoose.Types.ObjectId(data.userId),
        jobId: new mongoose.Types.ObjectId(data.jobId),
        status: data.status || "applied",
        aiScore: data.aiScore || 0,
        aiAnalysis: data.aiAnalysis || ""
      });
      return await app.save();
    } else {
      const _id = "app_" + Math.random().toString(36).substr(2, 9);
      const newApp = {
        _id,
        userId: data.userId,
        jobId: data.jobId,
        status: data.status || "applied",
        aiScore: data.aiScore || 0,
        aiAnalysis: data.aiAnalysis || "",
        createdAt: new Date()
      };
      
      // Prevent duplicates in fallback
      const exists = localData.applications.some(a => a.userId === data.userId && a.jobId === data.jobId);
      if (exists) {
        const idx = localData.applications.findIndex(a => a.userId === data.userId && a.jobId === data.jobId);
        localData.applications[idx] = { ...localData.applications[idx], ...data };
        saveLocalDB();
        return localData.applications[idx];
      }
      
      localData.applications.push(newApp);
      saveLocalDB();
      return newApp;
    }
  },

  async getAllApplications() {
    if (isConnectedToMongo) {
      return await ApplicationModel.find()
        .populate("userId", "name email skills videoURL summary")
        .populate("jobId", "title company skillsRequired")
        .lean();
    } else {
      // Re-hydrate populated links
      return localData.applications.map(app => {
        const user = localData.users.find(u => u._id === app.userId) || { name: "Unknown", email: "", skills: [], videoURL: "", summary: "" };
        const job = localData.jobs.find(j => j._id === app.jobId) || { title: "Unknown Position", company: "Unknown Company", skillsRequired: [] };
        const { password, ...userSanitized } = user;
        return {
          ...app,
          userId: userSanitized,
          jobId: job
        };
      });
    }
  },

  async getApplicationsByCandidate(candidateId: string) {
    if (isConnectedToMongo) {
      return await ApplicationModel.find({ userId: candidateId })
        .populate("jobId", "title company skillsRequired")
        .lean();
    } else {
      return localData.applications
        .filter(app => app.userId === candidateId)
        .map(app => {
          const job = localData.jobs.find(j => j._id === app.jobId) || { title: "Unknown Position", company: "Unknown Company", skillsRequired: [] };
          return {
            ...app,
            jobId: job
          };
        });
    }
  },

  async updateApplicationStatus(id: string, status: string) {
    if (isConnectedToMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await ApplicationModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
    } else {
      const idx = localData.applications.findIndex(app => app._id === id);
      if (idx !== -1) {
        localData.applications[idx].status = status;
        saveLocalDB();
        return localData.applications[idx];
      }
      return null;
    }
  },

  async updateUserProfile(id: string, update: any) {
    if (isConnectedToMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await UserModel.findByIdAndUpdate(id, { $set: update }, { new: true }).select("-password").lean();
    } else {
      const idx = localData.users.findIndex(u => u._id === id);
      if (idx !== -1) {
        localData.users[idx] = { ...localData.users[idx], ...update };
        saveLocalDB();
        const { password, ...sansPassword } = localData.users[idx];
        return sansPassword;
      }
      return null;
    }
  },

  async updateApplicationDetails(id: string, update: any) {
    if (isConnectedToMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await ApplicationModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    } else {
      const idx = localData.applications.findIndex(app => app._id === id);
      if (idx !== -1) {
        localData.applications[idx] = { ...localData.applications[idx], ...update };
        saveLocalDB();
        return localData.applications[idx];
      }
      return null;
    }
  },

  async createMessage(data: { senderId: string; receiverId: string; content: string }) {
    if (isConnectedToMongo) {
      const msg = new MessageModel({
        senderId: new mongoose.Types.ObjectId(data.senderId),
        receiverId: new mongoose.Types.ObjectId(data.receiverId),
        content: data.content
      });
      const saved = await msg.save();
      return await MessageModel.findById(saved._id)
        .populate("senderId receiverId", "name email role")
        .lean();
    } else {
      const _id = "msg_" + Math.random().toString(36).substr(2, 9);
      const newMsg = {
        _id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        isRead: false,
        createdAt: new Date()
      };
      if (!localData.messages) localData.messages = [];
      localData.messages.push(newMsg);
      saveLocalDB();
      return newMsg;
    }
  },

  async getConversation(user1: string, user2: string) {
    if (isConnectedToMongo) {
      return await MessageModel.find({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 }
        ]
      })
      .sort({ createdAt: 1 })
      .populate("senderId receiverId", "name email role")
      .lean();
    } else {
      if (!localData.messages) localData.messages = [];
      return localData.messages
        .filter(m => 
          (m.senderId === user1 && m.receiverId === user2) || 
          (m.senderId === user2 && m.receiverId === user1)
        )
        .map(msg => {
          const sender = localData.users.find(u => u._id === msg.senderId) || { name: "Sender", email: "" };
          const receiver = localData.users.find(u => u._id === msg.receiverId) || { name: "Receiver", email: "" };
          return {
            ...msg,
            senderId: { _id: msg.senderId, name: sender.name, email: sender.email },
            receiverId: { _id: msg.receiverId, name: receiver.name, email: receiver.email }
          };
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }
};

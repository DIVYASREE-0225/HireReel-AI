export type Role = "candidate" | "recruiter";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  skills: string[];
  videoURL: string;
  summary?: string;
  createdAt?: string;
  
  // KYC & Identity
  kycStatus?: "unverified" | "pending" | "verified" | "rejected";
  kycAadhaarPANFile?: string;
  kycSelfieFile?: string;
  phone?: string;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;

  // Portfolio details
  githubURL?: string;
  linkedinURL?: string;
  portfolioURL?: string;
  certifications?: string[];
  projects?: Array<{ title: string; description: string; link: string }>;
  pdfResumeURL?: string;

  // Recruiter fields
  isRecruiterVerified?: boolean;
  companyEmail?: string;
  companyName?: string;
  companyLogo?: string;
  companyDescription?: string;
  companyWebsite?: string;
  companyIndustry?: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  skillsRequired: string[];
  description: string;
  createdAt?: string;
}

export interface Application {
  _id: string;
  userId: User | string; // Can be populated or ID
  jobId: Job | string;   // Can be populated or ID
  status: "applied" | "shortlisted" | "interview" | "selected";
  aiScore: number;
  aiAnalysis: string; // Store stringified JSON
  createdAt?: string;
}

export interface AIMatchAnalysis {
  score: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
  interviewQuestions: string[];
}

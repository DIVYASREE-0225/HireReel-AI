# 🚀 HireReel AI

<div align="center">

### 🎥 AI-Powered Video-First Hiring Platform

Transforming traditional recruitment into an intelligent, interactive, and AI-driven hiring experience with video resumes, smart candidate matching, and modern recruiter workflows.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

# 🌟 Project Overview

**HireReel AI** is a modern AI-powered video-first hiring platform built to revolutionize the recruitment process using AI candidate matching, recruiter analytics, video resumes, and intelligent hiring workflows.

Unlike traditional hiring systems that rely only on static resumes, HireReel AI enables candidates to showcase their communication skills, confidence, personality, and technical expertise through interactive video resumes and AI-enhanced profiles.

The platform creates a seamless hiring ecosystem for both candidates and recruiters with modern SaaS UI/UX and scalable backend architecture.

---

# ✨ Features Implemented

## 🔐 Authentication System

- JWT-based authentication
- Secure Login & Signup
- Password hashing using bcrypt
- Protected backend routes
- Role-based authentication

---

## 👤 Candidate Features

- Candidate profile creation
- Skills portfolio management
- Video resume upload
- Resume recording feature
- PDF resume upload
- Job discovery & applications
- Application status tracking
- Responsive candidate dashboard
- Dark & Light theme support

---

## 🧑‍💼 Recruiter Features

- Recruiter dashboard
- Candidate search & filtering
- AI-based candidate matching
- Candidate video evaluation
- Hiring pipeline management
- Candidate shortlisting
- Recruiter analytics
- Smart candidate ranking system

---

## 🤖 AI Features

- AI skill match percentage
- Candidate-job matching
- Intelligent recruiter workflow
- Smart ranking logic
- Resume insights & summaries

---

## 🎨 UI/UX Features

- Modern SaaS-inspired UI
- Fully responsive design
- Dark & Light mode
- Smooth user experience
- Interactive dashboard cards
- Gradient UI styling
- Glassmorphism effects

---

## ☁️ Cloud Integrations

- MongoDB Atlas database integration
- Cloudinary video & media storage
- REST API integration
- Deployment-ready architecture

---

# 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, TypeScript, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT (JSON Web Token), bcrypt.js |
| AI Integration | Gemini AI |
| Storage | Cloudinary |
| Deployment | Vercel, Render |
| Version Control | Git & GitHub |

---

# 📂 Project Structure

```bash
HireReel-AI/
│
├── backend/
│
├── src/
│   ├── components/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── types.ts
│
├── .env.example
├── .gitignore
├── README.md
├── index.html
├── metadata.json
├── package-lock.json
├── package.json
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

---

# ⚙️ Setup Instructions

## 📌 Clone Repository

```bash
git clone https://github.com/your-username/HireReel-AI.git
cd HireReel-AI
```

---

# 🚀 Frontend Setup

## Install Dependencies

```bash
npm install
```

## Run Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🚀 Backend Setup

## Install Dependencies

```bash
npm install
```

## Run Backend

```bash
npm start
```

Backend runs on:

```bash
http://localhost:5000
```

---

# 🔑 Environment Variables

Create a `.env` file and add:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VITE_API_URL=your_backend_url
```

---

# 🔥 API Features

## Authentication APIs

```http
POST /api/auth/register
POST /api/auth/login
```

## User APIs

```http
GET /api/users
GET /api/users/:id
```

## Job APIs

```http
GET /api/jobs
POST /api/jobs
```

## Application APIs

```http
POST /api/apply
GET /api/applications
```

---

# 🎯 Core Highlights

✅ AI-powered recruitment platform

✅ Video-first hiring workflow

✅ Smart recruiter dashboard

✅ Interactive candidate profiles

✅ AI match scoring system

✅ Cloud-based media storage

✅ Scalable full-stack architecture

✅ Production-ready SaaS UI

---

# 🌍 Future Enhancements

- AI video interview analysis
- NLP-based resume parsing
- Voice sentiment analysis
- Advanced AI recommendations
- Multi-company hiring ecosystem
- Mobile application support
- Real-time recruiter-candidate chat
- Integrated coding assessment platform

---

# 📸 Screenshots

<img width="1866" height="811" alt="Screenshot (327)" src="https://github.com/user-attachments/assets/78299df3-6104-4c9d-bf99-32104fb53d2c" />

<img width="1872" height="855" alt="Screenshot (321)" src="https://github.com/user-attachments/assets/f63bae5b-cd94-4cba-9e0b-bed12a678a80" />

<img width="1866" height="836" alt="Screenshot (318)" src="https://github.com/user-attachments/assets/f5c7e35c-13dc-4aeb-b68d-974335820c49" />

<img width="1845" height="824" alt="Screenshot (319)" src="https://github.com/user-attachments/assets/d051e9a9-a554-462c-a00c-fc2b781f0b10" />

<img width="1871" height="838" alt="Screenshot (326)" src="https://github.com/user-attachments/assets/f314d5b4-dd76-4b5e-81de-ae54be4ae060" />

<img width="1869" height="830" alt="Screenshot (324)" src="https://github.com/user-attachments/assets/23c7099b-26c7-48b9-aa2d-50fde03832e8" />



---

# 🚀 Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Media Storage | Cloudinary |

---

# 🏆 Why HireReel AI?

HireReel AI bridges the gap between recruiters and candidates by enabling smarter, faster, and more human-centric hiring experiences powered by AI and video technology.

The platform helps recruiters discover talent beyond traditional resumes while enabling candidates to showcase real communication skills, personality, and confidence.

---

# 👨‍💻 Author

### Kummari Divya Sree

Passionate AI & Full Stack Developer focused on building impactful AI-powered SaaS applications, intelligent recruitment systems, and scalable modern web platforms.

---

<div align="center">

## ⭐ If you like this project, give it a star on GitHub ⭐

</div>

# 🚀 HireReel AI

<div align="center">

### 🎥 AI-Powered Video-First Hiring Platform

Transforming traditional recruitment into an intelligent, interactive, and video-driven hiring experience.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge\&logo=next.js\&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge\&logo=mongodb\&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge\&logo=cloudinary\&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge\&logo=jsonwebtokens\&logoColor=white)

</div>

---

# 🌟 Project Overview

**HireReel AI** is a modern AI-powered recruitment platform designed to revolutionize the hiring process using video resumes, AI candidate matching, recruiter analytics, and interactive hiring workflows.

Unlike traditional hiring systems that rely only on static resumes, HireReel AI enables candidates to showcase their communication skills, confidence, personality, and technical expertise through dynamic video resumes and AI-enhanced profiles.

The platform provides a complete hiring ecosystem for both:

## 👤 Candidates

* Secure authentication
* Professional profile creation
* Video resume upload & recording
* PDF resume upload
* Job discovery & applications
* Skills portfolio management
* Real-time application tracking
* Dark/Light theme experience

## 🧑‍💼 Recruiters

* Recruiter dashboard
* Candidate search engine
* AI-based candidate matching
* Hiring pipeline management
* Interview scheduling
* Candidate video evaluation
* Smart candidate ranking
* Real-time recruitment workflow

---

# ✨ Features Implemented

## 🔐 Authentication System

* JWT-based authentication
* Secure login & signup
* Password hashing using bcrypt
* Protected routes & middleware

## 👤 Candidate Features

* Candidate profile builder
* Skills & portfolio section
* Video resume upload using Cloudinary
* PDF resume upload
* Record resume feature (webcam support)
* Job listing & search
* Apply to jobs
* Application status tracking
* Responsive dashboard UI

## 🧑‍💼 Recruiter Features

* Recruiter login system
* Candidate management dashboard
* Candidate video resume viewer
* AI skill match percentage
* Candidate search & filtering
* Hiring pipeline management
* Shortlist candidates
* Interview scheduling
* Recruiter analytics dashboard

## 🤖 AI Features

* AI candidate-job matching
* Smart ranking system
* Skill match percentage calculation
* Resume insights & summaries

## 🎨 UI/UX Features

* Modern SaaS-inspired UI
* Fully responsive design
* Dark & Light mode
* Smooth animations
* Interactive dashboard cards
* Gradient UI design
* Glassmorphism effects

## ☁️ Cloud Integrations

* MongoDB Atlas database integration
* Cloudinary video & file storage
* Real-time API integration

---

# 🛠️ Tech Stack

| Category           | Technologies                                          |
| ------------------ | ----------------------------------------------------- |
| Frontend           | Next.js, React.js, Tailwind CSS, Axios, Framer Motion |
| Backend            | Node.js, Express.js                                   |
| Database           | MongoDB Atlas                                         |
| Authentication     | JWT (JSON Web Token), bcrypt.js                       |
| Storage            | Cloudinary                                            |
| Real-time Features | Socket.IO                                             |
| Deployment         | Vercel, Render                                        |
| Version Control    | Git & GitHub                                          |

---

# 📂 Project Structure

```bash
HireReel-AI/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   ├── server.ts
│   └── db.ts
│
├── src/
│   ├── components/
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   └── index.css
│
├── gemini.ts
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── index.html
```
```

---

# ⚙️ Setup Instructions

## 📌 1. Clone the Repository

```bash
git clone https://github.com/your-username/hirereel-ai.git
cd hirereel-ai
```

---

# 🚀 Frontend Setup

## Install Dependencies

```bash
cd frontend
npm install
```

## Create Environment File

Create:

```bash
.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Run Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:3000
```

---

# 🚀 Backend Setup

## Install Dependencies

```bash
cd backend
npm install
```

## Create Environment File

Create:

```bash
.env
```

Add:

```env
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Run Backend

```bash
node server.js
```

Backend runs on:

```bash
http://localhost:5000
```

---

# 🔥 API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

## Users

```http
GET /api/users
GET /api/users/:id
```

## Jobs

```http
GET /api/jobs
POST /api/jobs
```

## Applications

```http
POST /api/apply
GET /api/applications
```

---

# 🎯 Core Highlights

✅ Video-first recruitment platform

✅ AI-powered hiring workflow

✅ Real-time recruiter dashboard

✅ Interactive candidate profiles

✅ Cloud-based media storage

✅ Full-stack scalable architecture

✅ Production-ready SaaS UI

---

# 🌍 Future Enhancements

* AI video interview analysis
* Resume parsing with NLP
* Voice sentiment analysis
* Advanced AI recommendations
* Multi-company hiring ecosystem
* Mobile application support
* Integrated coding assessment platform

---

# 🏆 Why HireReel AI?

HireReel AI bridges the gap between talent and recruiters by enabling candidates to showcase their real personality, communication skills, and confidence beyond traditional resumes.

The platform creates a smarter, faster, and more human-centric hiring experience powered by AI and modern video technology.

---

# 📸 Screenshots

> Add your project screenshots here.

* Login Page
* Candidate Dashboard
* Recruiter Dashboard
* Video Resume Upload
* Hiring Pipeline
* Dark Mode UI

---

# 🚀 Deployment

| Service       | Platform      |
| ------------- | ------------- |
| Frontend      | Vercel        |
| Backend       | Render        |
| Database      | MongoDB Atlas |
| Media Storage | Cloudinary    |

---

# 👨‍💻 Author

### Kummari Divya Sree

Passionate Full Stack & AI Developer focused on building impactful AI-powered solutions and scalable SaaS applications.

---

<div align="center">

## ⭐ If you like this project, give it a star on GitHub ⭐

</div>

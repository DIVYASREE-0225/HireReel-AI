import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI SDK with the standard user-agent and process env key
let ai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      console.log("🌟 Gemini Client initialized successfully with @google/genai");
    } catch (err) {
      console.error("⚠️ Failed to initialize Gemini Client:", err);
    }
  }
  return ai;
}

interface AIMatchResult {
  score: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
  interviewQuestions: string[];
}

/**
 * Uses Gemini AI to analyze how well a candidate's profile/skills matches a job requirement.
 * If Gemini is not configured, falls back to a deterministic string-distance matcher.
 */
export async function analyzeJobMatch(
  candidateName: string,
  candidateSkills: string[],
  jobTitle: string,
  jobCompany: string,
  jobSkills: string[],
  jobDescription: string
): Promise<AIMatchResult> {
  const client = getGeminiClient();
  
  if (client) {
    try {
      const prompt = `Analyze the match between a candidate and a job posting for HireReel AI.
      
Candidate:
Name: ${candidateName}
Skills: ${candidateSkills.join(", ")}

Job Posting:
Title: ${jobTitle}
Company: ${jobCompany}
Required Skills: ${jobSkills.join(", ")}
Description: ${jobDescription}

Provide a structured analysis outlining:
1. Match score (an integer percentage from 0 to 100). Keep it realistic based on the overlap.
2. Brief reasoning / analysis of why they fit or don't fit the role (1-2 sentences).
3. Listed strengths of the candidate for this specific role (up to 3 items).
4. Major gaps or areas of improvement (up to 2 items).
5. Suggested interview questions specifically tailored to their background and the job requirements (exactly 2 questions).

Return the response strictly inside a JSON object with the exact keys:
"score" (number), "reasoning" (string), "strengths" (array of strings), "gaps" (array of strings), "interviewQuestions" (array of strings)`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Candidate fit score from 0 to 100" },
              reasoning: { type: Type.STRING, description: "Short overview of the candidate fit" },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of key strengths"
              },
              gaps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of missing skills or gaps"
              },
              interviewQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Tailored interview questions"
              }
            },
            required: ["score", "reasoning", "strengths", "gaps", "interviewQuestions"]
          }
        }
      });

      if (response && response.text) {
        const data = JSON.parse(response.text.trim());
        return {
          score: Math.min(100, Math.max(0, Number(data.score) || 0)),
          reasoning: data.reasoning || "Successful skill-matching analysis.",
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          gaps: Array.isArray(data.gaps) ? data.gaps : [],
          interviewQuestions: Array.isArray(data.interviewQuestions) ? data.interviewQuestions : []
        };
      }
    } catch (err) {
      console.error("⚠️ Gemini API match analysis failed. Using deterministic algorithm fallback.", err);
    }
  }

  // Robust, smart deterministic matching fallback
  const cSkillsLower = candidateSkills.map(s => s.toLowerCase().trim());
  const jSkillsLower = jobSkills.map(s => s.toLowerCase().trim());
  
  let matches = 0;
  jSkillsLower.forEach(js => {
    if (cSkillsLower.some(cs => cs.includes(js) || js.includes(cs))) {
      matches++;
    }
  });

  const overlapPercent = jobSkills.length > 0 ? Math.round((matches / jobSkills.length) * 100) : 0;
  // Let's add slight baseline or randomizer to seem intelligent
  const baseScore = jobSkills.length === 0 ? 50 : overlapPercent;
  const finalScore = Math.max(10, Math.min(95, baseScore));

  const strengths = candidateSkills.filter(s => 
    jSkillsLower.some(js => s.toLowerCase().includes(js) || js.toLowerCase().includes(s.toLowerCase()))
  ).slice(0, 3);
  if (strengths.length === 0) strengths.push("Eager to learn and adapt", "Enthusiastic to work in modern environments");

  const gaps = jobSkills.filter(s => 
    !cSkillsLower.some(cs => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs))
  ).slice(0, 2);
  if (gaps.length === 0) gaps.push("Niche framework deep-dives");

  return {
    score: finalScore,
    reasoning: `Deterministic skill-match: overlap of ${matches} out of ${jobSkills.length} requested core keywords. Candidate displays positive readiness.`,
    strengths,
    gaps,
    interviewQuestions: [
      `How do you manage deploying platforms requiring ${jobSkills[0] || "modern software standards"}?`,
      `Describe a time where you worked to bridge a technology gap in a team.`
    ]
  };
}

/**
 * Uses Gemini AI to generate a comprehensive candidate summary based on profile.
 */
export async function generateCandidateSummary(
  name: string,
  skills: string[],
  videoURL?: string
): Promise<string> {
  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `Synthesize a brief, powerful, professional elevator pitch/summary for matching candidate "${name}".
Current Skills: ${skills.join(", ")}
${videoURL ? `They have recorded a video resume at standard link: ${videoURL}` : "No video resume URL submitted yet."}

Write a 2-sentence highly professional narrative describing their career focus and software styling focus.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.error("⚠️ Gemini API summary generation failed. Returning default summary format.", err);
    }
  }

  return `${name} is a dedicated practitioner skilled in ${skills.slice(0, 4).join(", ")}. They possess excellent visual execution capacities and high motivation to coordinate complex features.`;
}

import { GoogleGenAI } from "@google/genai";
import { UseCase } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateImplementationPlan(useCase: UseCase) {
  const prompt = `
    As an AI Solutions Architect, create a detailed implementation plan for the following AI use case:
    
    Title: ${useCase.title}
    Summary: ${useCase.summary}
    Problem: ${useCase.problemStatement || useCase.businessProblem}
    Solution: ${useCase.solution || useCase.description}
    AI Capability: ${useCase.aiCapability}
    WalkMe Feature: ${useCase.walkmeFeature}
    
    Please provide the plan in the following structure:
    1. Technical Architecture (Detailed)
    2. Step-by-Step Implementation Guide (5-7 steps)
    3. Data Requirements & Security Considerations
    4. Potential Risks & Mitigation Strategies
    5. Success Metrics & KPIs
    
    Format the output in clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function generateSimilarUseCases(useCase: UseCase) {
  const prompt = `
    Based on the following AI use case, suggest 3 similar or complementary use cases that would provide additional value:
    
    Title: ${useCase.title}
    Summary: ${useCase.summary}
    Business Function: ${useCase.businessFunction}
    
    For each suggestion, provide:
    - Title
    - 1-line Summary
    - Why it's complementary
    
    Format as a JSON array of objects with keys: title, summary, reasoning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

export async function generateUseCaseFromPrompt(prompt: string) {
  const systemPrompt = `
    As an AI Solutions Architect, help me draft a structured AI use case based on a brief description.
    
    User Input: "${prompt}"
    
    Please extract or generate the following fields:
    - title: A concise, catchy title
    - summary: A 1-sentence summary
    - description: A detailed description of the use case
    - businessProblem: The core pain point this solves
    - solution: How AI + WalkMe solves it
    - aiCapability: The specific AI technology (e.g., LLM, Computer Vision, Predictive)
    - walkmeFeature: The relevant WalkMe feature (e.g., ActionBot, Smart Walk-Thru, DAP)
    - businessFunction: One of [Sales, Marketing, HR, IT, Customer Success, Product, Operations, Finance]
    - useCaseType: One of [Content Generation, Automation, Personalization, Analytics, Support, Training]
    - roiLevel: One of [High, Medium, Low]
    - implementationEffort: One of [High, Medium, Low]
    
    Format the output as a clean JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

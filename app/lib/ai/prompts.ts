/**
 * AI Prompt Templates Module (I13)
 * Centralizes all system and user prompt instruction templates.
 * Enforces strict, parsable JSON responses across LLM providers (Ollama, OpenAI, Qwen, etc.).
 */

// ==========================================
// 1. OPTIMIZER TEMPLATES
// ==========================================

export function buildOptimizerSystemPrompt(category: string): string {
  return `You are PromptMaster, an expert prompt engineering assistant.
Your goal is to optimize the user's prompt for the category: "${category}".

Follow these strict rules:
1. Preserve the user's original intent and meaning.
2. Make the prompt clearer, more specific, and well-structured.
3. Inject appropriate contextual detail, constraints, tone instructions, and format expectations.
4. Output the result in valid JSON only, conforming to the exact schema defined below. Do not wrap the JSON in markdown code blocks (\`\`\`), do not write explanations before or after the JSON.

Expected JSON output format:
{
  "improvedPrompt": "The optimized, final prompt to be copy-pasted directly.",
  "explanation": [
    "Explanation of why changes were made.",
    "Detail on what context or rules were added.",
    "How this improves LLM performance."
  ],
  "variants": [
    "Alternative version 1 (e.g. more minimal/concise)",
    "Alternative version 2 (e.g. more detailed)",
    "Alternative version 3 (e.g. role-play focused)"
  ],
  "patterns": [
    "Pattern 1 (e.g. Few-Shot, Persona)",
    "Pattern 2"
  ]
}`;
}

export function buildOptimizerUserPrompt(params: {
  prompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  personalStyle?: string;
}): string {
  const styleBlock = params.personalStyle?.trim()
    ? `\nPersonal Style Preference:\n- ${params.personalStyle.trim()}`
    : "";

  return `Optimize this prompt:
"${params.prompt}"

Parameters:
- Target Model: ${params.model}
- Optimization Goal: ${params.goal}
- Optimization Depth: ${params.depth}
- Expected Output Format: ${params.outputFormat}${styleBlock}

Optimize and return the JSON payload.`;
}

// ==========================================
// 2. SCORER / EVALUATOR TEMPLATES
// ==========================================

export function buildScorerSystemPrompt(): string {
  return `You are PromptMaster Scorer, an AI prompt evaluation engine.
Evaluate the user's prompt based on prompt engineering best practices.

Evaluate across these 5 criteria (0-20 points each):
1. Clarity (Is the task clear and unambiguous?)
2. Specificity (Are the requirements detailed and precise?)
3. Context (Is background information or target audience provided?)
4. Constraints (Are rules, limits, or negative instructions defined?)
5. Output Format (Is the final output structure specified?)

Rules:
- Give a score from 0 to 20 for each of the 5 criteria.
- Calculate the overall score (sum of all 5 criteria, from 0 to 100).
- Output the result in valid JSON only. Do not add any conversational text.

Expected JSON output format:
{
  "score": 85,
  "breakdown": {
    "clarity": 18,
    "specificity": 16,
    "context": 15,
    "constraints": 18,
    "outputFormat": 18
  },
  "reasoning": "Explanation of the scoring breakdown and how the user can improve it."
}`;
}

export function buildScorerUserPrompt(prompt: string, category: string): string {
  return `Evaluate this prompt for the category: "${category}".
Prompt content:
"${prompt}"

Evaluate and return the JSON score.`;
}

// ==========================================
// 3. EXTRACTOR TEMPLATES
// ==========================================

export function buildExtractorSystemPrompt(): string {
  return `You are PromptMaster Ingestion Agent.
Your job is to read raw crawled logs or web content, find useful prompts, and extract them into clean, structured data.

Rules:
1. Look for prompt templates, commands, or optimization examples.
2. Clean up any HTML, markdown noise, or conversational headers.
3. Identify the main category of the prompt (e.g. Coding, Image Generation, Marketing, General).
4. Output the result in valid JSON only.

Expected JSON output format:
{
  "title": "A short descriptive title for the prompt",
  "prompt": "The clean, reusable prompt template content",
  "category": "Detected category",
  "patterns": ["Roleplay", "Formatting constraints", "Few-shot examples"]
}`;
}

export function buildExtractorUserPrompt(rawText: string): string {
  return `Extract the prompt from the following raw content:
---
${rawText}
---
Return the clean prompt JSON.`;
}

// ==========================================
// 4. QUALITY GUARD / RUBRIC VALIDATOR TEMPLATES
// ==========================================

export function buildQualityGuardSystemPrompt(): string {
  return `You are PromptMaster Quality Guard.
Your job is to validate if a generated prompt or rewritten prompt is high quality or if it has issues (e.g. empty, duplicate, low quality, contains code block issues, or hallucinated content).

Rules:
1. Mark isValid as true if the prompt is clear, has strong structure, and contains no malformed blocks.
2. Mark isValid as false if it has major issues like empty content, is identical to original, or contains formatting errors.
3. Output the result in valid JSON only.

Expected JSON output format:
{
  "isValid": true,
  "issues": [
    "No major issues found."
  ],
  "reasons": [
    "Prompt has clear goals and sets constraints."
  ]
}`;
}

export function buildQualityGuardUserPrompt(originalPrompt: string, optimizedPrompt: string): string {
  return `Compare the original prompt with the optimized prompt to check for quality and validity:

Original Prompt:
"${originalPrompt}"

Optimized Prompt:
"${optimizedPrompt}"

Evaluate and return the validation JSON response.`;
}

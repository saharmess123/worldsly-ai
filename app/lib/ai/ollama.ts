export async function getOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      return data.models.map((m: { name: string }) => m.name);
    }
    return [];
  } catch {
    return [];
  }
}

export async function chatWithOllama(
  systemPrompt: string,
  userPrompt: string,
  preferredModel = "llama3.2"
): Promise<string | null> {
  try {
    const availableModels = await getOllamaModels();
    if (availableModels.length === 0) {
      return null;
    }

    let modelToUse = preferredModel;
    if (!availableModels.includes(preferredModel)) {
      const match = availableModels.find(m => m.startsWith(preferredModel));
      if (match) {
        modelToUse = match;
      } else {
        modelToUse = availableModels[0];
      }
    }

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.1
        }
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.message?.content || null;
  } catch (error) {
    console.error("Ollama chat failed:", error);
    throw error;
  }
}

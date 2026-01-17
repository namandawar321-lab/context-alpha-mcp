require("dotenv").config();

async function generateBlueprintFromText(prompt, errorMessage = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const systemPrompt = `
You are a workflow planner.
You MUST output ONLY valid JSON.
NO explanations, NO markdown.

Allowed trigger:
- http_webhook

Allowed actions:
- log_event
- send_email

JSON format:
{
  "name": "string",
  "trigger": "http_webhook",
  "steps": [
    { "action": "string", "params": {} }
  ]
}

${errorMessage ? "PREVIOUS ERROR: " + errorMessage : ""}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n" + prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join("") || "";

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in Gemini response:\n" + text);
  }

  return JSON.parse(match[0]);
}

module.exports = { generateBlueprintFromText };

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getCKBKnowledge } from "@/lib/ckb-knowledge";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    checkpointId: number;
    checkpointTitle: string;
    concept: string;
    input: string;
    succeeded: boolean;
    error?: string;
  };

  const { checkpointTitle, concept, input, succeeded, error } = body;

  const userPrompt = succeeded
    ? `A developer just completed the "${checkpointTitle}" checkpoint successfully.
Their input was: ${input}

The concept behind this checkpoint:
${concept}

Give them a short "did you know" insight that goes one level deeper than what they just did.
Something that will stick: a nuance, an edge case, or a real-world implication they should know.`
    : `A developer failed the "${checkpointTitle}" checkpoint.
Their input was: ${input}
The error was: ${error}

The concept behind this checkpoint:
${concept}

Explain why they likely failed, using a concrete analogy specific to what went wrong.
Then give them the clearest possible mental model for the concept so they won't make this mistake again.
Be empathetic. This is a genuinely tricky part of CKB.`;

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 300,
    messages: [
      { role: "system", content: getCKBKnowledge() },
      { role: "user", content: userPrompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  return NextResponse.json({ explanation: text });
}

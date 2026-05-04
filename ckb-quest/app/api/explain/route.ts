import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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

  const systemPrompt = `You are a CKB blockchain educator with deep expertise in the Nervos ecosystem.
You explain concepts clearly to developers who are new to CKB but experienced in other blockchains.
You use precise analogies and never talk down to the learner.
Keep responses under 200 words. Use plain text — no markdown headers, no bullet points.
Be direct. Focus on the WHY, not just the what.`;

  const userPrompt = succeeded
    ? `A developer just completed the "${checkpointTitle}" checkpoint successfully.
Their input was: ${input}

The concept behind this checkpoint:
${concept}

Give them a short "did you know" insight that goes one level deeper than what they just did.
Something that will stick — a nuance, an edge case, or a real-world implication they should know.`
    : `A developer failed the "${checkpointTitle}" checkpoint.
Their input was: ${input}
The error was: ${error}

The concept behind this checkpoint:
${concept}

Explain why they likely failed, using a concrete analogy specific to what went wrong.
Then give them the clearest possible mental model for the concept so they won't make this mistake again.
Be empathetic — this is a genuinely tricky part of CKB.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ explanation: text });
}

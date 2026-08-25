import { NdaFormData } from "./types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  fields: Partial<NdaFormData>;
  isComplete: boolean;
}

export class ChatRequestError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function sendChatMessage(
  messages: ChatMessage[],
  fields: Partial<NdaFormData>,
): Promise<ChatResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, fields }),
    });
  } catch {
    throw new ChatRequestError(
      "Couldn't reach the AI assistant. Please check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw new ChatRequestError(
      "The AI assistant is temporarily unavailable. Please try again.",
    );
  }

  const body = await response.json();
  return {
    reply: body.reply,
    fields: withoutNullValues(body.fields),
    isComplete: body.is_complete,
  };
}

function withoutNullValues(
  fields: Record<string, string | null>,
): Partial<NdaFormData> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<NdaFormData>;
}

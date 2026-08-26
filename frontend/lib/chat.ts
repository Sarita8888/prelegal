export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  fields: Record<string, string>;
  isComplete: boolean;
  suggestedDocumentType: string | null;
}

export class ChatRequestError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function sendChatMessage(
  documentType: string,
  messages: ChatMessage[],
  fields: Record<string, string | null | undefined>,
): Promise<ChatResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_type: documentType, messages, fields }),
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
    suggestedDocumentType: body.suggested_document_type ?? null,
  };
}

function withoutNullValues(
  fields: Record<string, string | null>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

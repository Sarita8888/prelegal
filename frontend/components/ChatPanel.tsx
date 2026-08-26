"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatMessage, sendChatMessage } from "@/lib/chat";

function article(name: string): string {
  return /^[aeiou]/i.test(name) ? "an" : "a";
}

export function ChatPanel({
  documentType,
  documentName,
  knownFields,
  onFieldsChange,
  onCompleteChange,
  onSuggestedDocumentType,
}: {
  documentType: string;
  documentName: string;
  knownFields: Record<string, string | null | undefined>;
  onFieldsChange: (patch: Record<string, string>) => void;
  onCompleteChange: (isComplete: boolean) => void;
  onSuggestedDocumentType: (documentType: string | null) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: "assistant",
      content:
        `Hi! I'll help you put together ${article(documentName)} ${documentName}. Let's start with ` +
        "the basics — who are the parties, and what's this agreement for?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Return focus to the message input once a reply (or error) has settled, so
  // the user can keep typing without reaching for the mouse.
  useEffect(() => {
    if (!isSending) inputRef.current?.focus();
  }, [isSending]);

  async function submitHistory(history: ChatMessage[]) {
    setIsSending(true);
    setError(null);
    try {
      const result = await sendChatMessage(documentType, history, knownFields);
      onFieldsChange(result.fields);
      onCompleteChange(result.isComplete);
      onSuggestedDocumentType(result.suggestedDocumentType);
      setMessages([...history, { role: "assistant", content: result.reply }]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The AI assistant is temporarily unavailable. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(history);
    setInput("");
    void submitHistory(history);
  }

  function handleRetry() {
    void submitHistory(messages);
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <ChatBubble key={index} message={message} />
        ))}
        {isSending && <p className="text-sm text-slate-400">Thinking…</p>}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}{" "}
            <button
              type="button"
              onClick={handleRetry}
              className="font-medium underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-slate-200 p-4"
      >
        <input
          ref={inputRef}
          aria-label="Your message"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Type your answer…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5f2e75] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          isUser ? "bg-[#209dd7] text-white" : "bg-slate-100 text-slate-900"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

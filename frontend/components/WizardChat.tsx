"use client";

import { Bot, ClipboardList, MoreVertical, Plus, RotateCcw, Send, User } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatResponse } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

type MessageBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

interface Props {
  equipmentId?: string;
  equipmentName?: string;
  alertId?: string;
  onResponse: (response: ChatResponse) => void;
  onNewChat?: () => void;
  sendMessage: (message: string) => Promise<ChatResponse>;
}

function starterMessage(equipmentId?: string, equipmentName?: string, alertId?: string): ChatMessage {
  return {
    role: "assistant",
    text: equipmentId
      ? `Asset context: ${equipmentName ?? equipmentId}${alertId ? " with an active alert" : ""}.`
      : "Select an asset to start a maintenance conversation."
  };
}

function cleanMarkdownText(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*{1,3}/g, "")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function assistantBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    const value = cleanMarkdownText(paragraph.join(" "));
    if (value) blocks.push({ type: "paragraph", text: value });
    paragraph = [];
  }

  function flushList() {
    const items = listItems.map(cleanMarkdownText).filter(Boolean);
    if (items.length) blocks.push({ type: "list", items });
    listItems = [];
  }

  for (const rawLine of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^[*_=-]{3,}$/.test(line.replace(/\s/g, ""))) {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = line.match(/^(?:[-*•]\s+|\d+[.)]\s+)(.+)$/);
    if (bullet) {
      flushParagraph();
      listItems.push(bullet[1]);
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    const cleaned = cleanMarkdownText(heading ? heading[1] : line);
    if (cleaned && cleaned.length <= 72 && /:$/.test(cleaned)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: cleaned.replace(/:$/, "") });
      continue;
    }

    flushList();
    paragraph.push(cleaned);
  }

  flushParagraph();
  flushList();
  return blocks.length ? blocks : [{ type: "paragraph", text: cleanMarkdownText(text) }];
}

function FormattedAssistantMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {assistantBlocks(text).map((block, index) => {
        if (block.type === "heading") {
          return (
            <p key={`${block.type}-${index}`} className="font-bold text-steel-950">
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={`${block.type}-${index}`} className="list-disc space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={item} className="pl-1">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={`${block.type}-${index}`}>{block.text}</p>;
      })}
    </div>
  );
}

export function WizardChat({ equipmentId, equipmentName, alertId, onResponse, onNewChat, sendMessage }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([starterMessage(equipmentId, equipmentName, alertId)]);
  }, [alertId, equipmentId, equipmentName]);

  useEffect(() => {
    const node = messageListRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [busy, messages]);

  function startNewChat() {
    setMessages([starterMessage(equipmentId, equipmentName, alertId)]);
    setInput("");
    setMenuOpen(false);
    onNewChat?.();
  }

  function usePrompt(prompt: string) {
    setInput(prompt);
    setMenuOpen(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setMessages((items) => [...items, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    try {
      const response = await sendMessage(message);
      setMessages((items) => [...items, { role: "assistant", text: response.message }]);
      onResponse(response);
    } catch (caught) {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: caught instanceof Error ? caught.message : "Unable to reach the maintenance copilot."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="relative flex items-center justify-between gap-3 border-b border-steel-100 bg-white p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-steel-950">
          <Bot size={18} className="text-blue-600" />
          AI Maintenance Copilot
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="New chat"
            onClick={startNewChat}
            className="focus-ring inline-flex h-8 items-center gap-1 rounded-md border border-steel-200 bg-white px-3 text-xs font-semibold text-steel-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus size={14} />
            New Chat
          </button>
          <button
            type="button"
            title="More options"
            onClick={() => setMenuOpen((value) => !value)}
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-steel-500 transition hover:bg-steel-50"
          >
            <MoreVertical size={16} />
          </button>
        </div>
        {menuOpen && (
          <div className="absolute right-5 top-16 z-10 w-52 rounded-md border border-steel-200 bg-white p-1.5 text-sm shadow-command">
            <button
              type="button"
              onClick={startNewChat}
              className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-semibold text-steel-700 transition hover:bg-steel-50"
            >
              <RotateCcw size={15} />
              Reset conversation
            </button>
            <button
              type="button"
              onClick={() => usePrompt("Summarize this alert and list the safest next actions.")}
              className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-semibold text-steel-700 transition hover:bg-steel-50"
            >
              <ClipboardList size={15} />
              Use alert summary
            </button>
          </div>
        )}
      </div>
      <div ref={messageListRef} className="max-h-[430px] min-h-[280px] space-y-4 overflow-y-auto bg-gradient-to-b from-white to-steel-50/70 p-5">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                <Bot size={16} />
              </span>
            )}
            <div
              className={`max-w-[86%] break-words rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "border border-steel-200/80 bg-white text-steel-800"
              }`}
            >
              {message.role === "assistant" ? <FormattedAssistantMessage text={message.text} /> : <p>{message.text}</p>}
            </div>
            {message.role === "user" && (
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-steel-200 text-steel-900 shadow-sm">
                <User size={16} />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-steel-100 p-5">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="field-control min-w-0 flex-1 text-sm"
            aria-label="Maintenance query"
            placeholder="Ask a maintenance question..."
          />
          <button
            type="submit"
            title="Send query"
            disabled={busy}
            className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Summarize this alert", "Show similar failures", "What spare parts are needed?"].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => usePrompt(prompt)}
              className="focus-ring rounded-md border border-steel-200 bg-white px-3 py-2 text-xs font-semibold text-steel-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

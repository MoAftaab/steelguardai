"use client";

import { Bot, ClipboardList, Mic, MoreVertical, Plus, RotateCcw, Send, User } from "lucide-react";
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
            <p key={`${block.type}-${index}`} className="font-bold text-white">
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
  const [isListening, setIsListening] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false; // Stop after speaking a sentence
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

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
      <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <Bot size={18} className="text-coolant-400" />
          AI Maintenance Copilot
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="New chat"
            onClick={startNewChat}
            className="control-button focus-ring inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-semibold transition"
          >
            <Plus size={14} />
            New Chat
          </button>
          <button
            type="button"
            title="More options"
            onClick={() => setMenuOpen((value) => !value)}
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-200"
          >
            <MoreVertical size={16} />
          </button>
        </div>
        {menuOpen && (
          <div className="absolute right-5 top-16 z-10 w-52 rounded-md border border-white/[0.1] bg-slate-900/95 p-1.5 text-sm shadow-xl backdrop-blur-xl">
            <button
              type="button"
              onClick={startNewChat}
              className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <RotateCcw size={15} />
              Reset conversation
            </button>
            <button
              type="button"
              onClick={() => usePrompt("Summarize this alert and list the safest next actions.")}
              className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ClipboardList size={15} />
              Use alert summary
            </button>
          </div>
        )}
      </div>
      <div ref={messageListRef} className="max-h-[430px] min-h-[280px] space-y-4 overflow-y-auto bg-white/[0.02] p-5">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                <Bot size={16} />
              </span>
            )}
            <div
              className={`max-w-[86%] break-words rounded-lg px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-coolant-600 to-coolant-500 text-white shadow-md shadow-coolant-500/20"
                  : "border border-white/[0.08] border-l-2 border-l-purple-500/50 bg-white/[0.05] text-slate-200"
              }`}
            >
              {message.role === "assistant" ? <FormattedAssistantMessage text={message.text} /> : <p>{message.text}</p>}
            </div>
            {message.role === "user" && (
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-slate-300 ring-1 ring-white/[0.12]">
                <User size={16} />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06] p-5">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="field-control min-w-0 flex-1 text-sm"
            aria-label="Maintenance query"
            placeholder={isListening ? "Listening..." : "Ask a maintenance question..."}
          />
          {recognitionRef.current && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Speak question"}
              className={`focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-all duration-300 ${
                isListening
                  ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/20"
                  : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:border-coolant-500/30 hover:text-coolant-400"
              }`}
            >
              <Mic size={18} />
            </button>
          )}
          <button
            type="submit"
            title="Send query"
            disabled={busy || !input.trim()}
            className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-coolant-500 to-coolant-600 text-white shadow-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-60"
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
              className="focus-ring rounded-md border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-400 shadow-sm transition-all duration-300 hover:border-coolant-500/30 hover:bg-coolant-500/10 hover:text-coolant-400"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

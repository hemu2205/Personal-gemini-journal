import { useState, useId, type FormEvent } from "react";
import {
  Sparkles,
  Send,
  User as UserIcon,
  Copy,
  Check,
  Download,
  Trash2,
  Clock,
  Compass,
  BookOpen,
  Lightbulb,
  ListChecks,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { Interaction, ReflectionMode, ChatMessage } from "../types";

interface ConversationViewProps {
  interaction: Interaction;
  onSendFollowUp: (text: string) => Promise<void>;
  onDeleteInteraction: (id: string) => Promise<void>;
  isSendingFollowUp: boolean;
  followUpError: string | null;
}

const CATEGORY_META: Record<
  ReflectionMode,
  { label: string; icon: typeof Compass; color: string }
> = {
  reflection: {
    label: "Deep Reflection",
    icon: Compass,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  summary: {
    label: "Summary & Themes",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  brainstorm: {
    label: "Creative Brainstorm",
    icon: Lightbulb,
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  action: {
    label: "Action Steps",
    icon: ListChecks,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function ConversationView({
  interaction,
  onSendFollowUp,
  onDeleteInteraction,
  isSendingFollowUp,
  followUpError,
}: ConversationViewProps) {
  const [followUpText, setFollowUpText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputId = useId();

  const meta = CATEGORY_META[interaction.category] || CATEGORY_META.reflection;
  const CategoryIcon = meta.icon;

  const handleFollowUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isSendingFollowUp) return;
    const textToSend = followUpText.trim();
    setFollowUpText("");
    try {
      await onSendFollowUp(textToSend);
    } catch {
      // Restore input text if send fails
      setFollowUpText(textToSend);
    }
  };

  const handleCopy = () => {
    const markdownContent = interaction.messages
      .map(
        (m) =>
          `### ${m.role === "user" ? "You" : "Gemini"}\n\n${m.content}\n`
      )
      .join("\n---\n\n");
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const titleClean = interaction.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const markdownContent = `# ${interaction.title}\n` +
      `**Category:** ${meta.label}\n` +
      `**Date:** ${new Date(interaction.createdAt).toLocaleString()}\n` +
      `**Model:** ${interaction.modelUsed || "gemini-3.6-flash"}\n\n` +
      `---\n\n` +
      interaction.messages
        .map(
          (m) =>
            `## ${m.role === "user" ? "User Reflection" : "Gemini AI"}\n\n${m.content}\n`
        )
        .join("\n---\n\n");

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reflection-${titleClean}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteInteraction(interaction.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div id="conversation-view" className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Top Details Bar */}
      <div className="p-5 sm:p-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}
            >
              <CategoryIcon className="h-3 w-3" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Synced to Firestore
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
              <Sparkles className="h-3 w-3 text-indigo-600" />
              {interaction.modelUsed || "gemini-3.6-flash"}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            {interaction.title}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-copy-interaction"
            onClick={handleCopy}
            title="Copy reflection to clipboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-medium transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-gray-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-download-interaction"
            onClick={handleDownload}
            title="Download reflection as Markdown"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            id="btn-delete-interaction"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this entry from Firestore"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="p-4 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-red-900">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>
              Are you sure you want to delete this reflection? This will remove it permanently from your private Firestore collection.
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              id="btn-cancel-delete"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-delete"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      )}

      {/* Multi-turn Messages Stream */}
      <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[60vh] bg-[#f9fafb]">
        {interaction.messages.map((message: ChatMessage) => {
          const isUser = message.role === "user";
          return isUser ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] sm:max-w-[70%] bg-white border border-gray-200 p-5 rounded-2xl rounded-tr-none shadow-sm">
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {message.content}
                </p>
                <span className="text-[10px] text-gray-400 mt-3 block font-mono">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-start items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md shadow-indigo-100">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="max-w-[90%] sm:max-w-[80%] bg-indigo-50/60 border border-indigo-100 p-5 sm:p-6 rounded-2xl rounded-tl-none">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>Gemini Reflection Guide</span>
                  <span className="text-[10px] font-normal text-indigo-400">({interaction.modelUsed || "gemini-3.6-flash"})</span>
                </p>
                <div className="text-sm leading-relaxed text-indigo-950 whitespace-pre-wrap font-sans">
                  {message.content}
                </div>
                <span className="text-[10px] text-indigo-400 mt-3 block font-mono">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Follow-up Alert Banner */}
      {followUpError && (
        <div className="mx-6 mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{followUpError}</span>
        </div>
      )}

      {/* Multi-turn Follow-up Input Bar */}
      <div className="p-5 sm:p-6 bg-white border-t border-gray-100">
        <form onSubmit={handleFollowUpSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <label htmlFor={inputId} className="sr-only">
              Multi-turn follow-up response
            </label>
            <textarea
              id={inputId}
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              disabled={isSendingFollowUp}
              placeholder="Reflect with Gemini... continue the conversation"
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none disabled:opacity-60 shadow-inner"
            />
          </div>

          <button
            type="submit"
            id="btn-send-followup"
            disabled={!followUpText.trim() || isSendingFollowUp}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSendingFollowUp ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <div className="flex justify-between items-center px-1 mt-2.5">
          <p className="text-[10px] text-gray-400">
            Multi-turn context preserved and synced to Cloud Firestore.
          </p>
          <span className="text-[10px] text-indigo-600 font-medium">Gemini 3.6 Flash Active</span>
        </div>
      </div>
    </div>
  );
}

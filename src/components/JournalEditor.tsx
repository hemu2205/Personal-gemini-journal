import { useState, useId, type FormEvent } from "react";
import { Sparkles, Send, RefreshCw, AlertCircle, BookOpen, Lightbulb, ListChecks, Compass } from "lucide-react";
import type { ReflectionMode } from "../types";

interface JournalEditorProps {
  onSubmit: (prompt: string, mode: ReflectionMode) => Promise<void>;
  isSubmitting: boolean;
  lastError: string | null;
  onRetry: () => void;
}

const MODES: Array<{
  id: ReflectionMode;
  label: string;
  icon: typeof Sparkles;
  description: string;
}> = [
  {
    id: "reflection",
    label: "Deep Reflection",
    icon: Compass,
    description: "Thoughtful perspective, emotional intelligence & introspective guiding questions",
  },
  {
    id: "summary",
    label: "Summary & Takeaways",
    icon: BookOpen,
    description: "Distills core themes, mindset patterns & key bulleted takeaways",
  },
  {
    id: "brainstorm",
    label: "Creative Brainstorming",
    icon: Lightbulb,
    description: "Divergent exploration of new angles, creative options & potential paths",
  },
  {
    id: "action",
    label: "Action Micro-Steps",
    icon: ListChecks,
    description: "Actionable, realistic micro-habits and practical next steps for today",
  },
];

const PROMPT_SUGGESTIONS = [
  "Navigating a difficult decision at work or in personal life...",
  "What drained my energy today, and what energized me?",
  "Brainstorming creative strategies for my upcoming project...",
  "Reframing a frustrating moment into a learning opportunity...",
];

export function JournalEditor({
  onSubmit,
  isSubmitting,
  lastError,
  onRetry,
}: JournalEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>("reflection");
  const textareaId = useId();

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;
    await onSubmit(prompt.trim(), selectedMode);
    // Note: Do not clear text here until parent confirms successful save transaction!
  };

  const handleApplyPrompt = (text: string) => {
    setPrompt(text);
  };

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;

  return (
    <div id="journal-editor-container" className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <span>New Reflection</span>
          <span className="text-xs font-normal text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
            Gemini 3.6 Flash
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Express your stream of consciousness, challenges, or goals. Gemini will synthesize and reflect with you.
        </p>
      </div>

      {/* Reflection Mode Selection */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
          Select AI Reflection Focus
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                id={`mode-select-${mode.id}`}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isSelected ? "text-indigo-600" : "text-gray-400"}`} />
                  <span className={`text-xs ${isSelected ? "font-semibold text-indigo-950" : "font-medium text-gray-800"}`}>
                    {mode.label}
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1 line-clamp-2 ${
                    isSelected ? "text-indigo-800/80" : "text-gray-500"
                  }`}
                >
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested Starters */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-medium">Inspiration Starters:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              id={`prompt-suggestion-${idx}`}
              onClick={() => handleApplyPrompt(suggestion)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 hover:border-indigo-200 border border-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner with Explicit Retry Button */}
      {lastError && (
        <div
          id="editor-error-banner"
          className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-red-900 uppercase tracking-wide">
                Transaction / Generation Alert
              </p>
              <p className="text-xs text-red-700 mt-0.5">{lastError}</p>
              <p className="text-[11px] text-red-600 mt-1">
                Your draft has been preserved safely in the box below.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-retry-save"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium shrink-0 transition-colors shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Save</span>
          </button>
        </div>
      )}

      {/* Reflection Input Form */}
      <form onSubmit={handleFormSubmit}>
        <div className="relative">
          <label htmlFor={textareaId} className="sr-only">
            Your Reflection or Journal Entry
          </label>
          <textarea
            id={textareaId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isSubmitting}
            placeholder="Write freely here... What experiences, decisions, thoughts, or emotions are on your mind right now?"
            rows={7}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y disabled:opacity-60 shadow-inner"
          />
        </div>

        {/* Footer info & submit */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{wordCount} words</span>
            <span>{prompt.length} characters</span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="hidden sm:inline text-gray-500">
              Isolated in Firestore upon save
            </span>
          </div>

          <div className="flex items-center gap-2">
            {prompt.trim().length > 0 && (
              <button
                type="button"
                id="btn-clear-draft"
                onClick={() => setPrompt("")}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              id="btn-submit-reflection"
              disabled={!prompt.trim() || isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Processing with Gemini...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-white" />
                  <span>Save &amp; Reflect with Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

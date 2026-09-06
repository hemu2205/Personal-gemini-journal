import { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Compass,
  Lightbulb,
  ListChecks,
  ChevronRight,
  Sparkles,
  Inbox,
} from "lucide-react";
import type { Interaction, ReflectionMode } from "../types";

interface HistorySidebarProps {
  interactions: Interaction[];
  selectedId: string | null;
  onSelect: (interaction: Interaction) => void;
  onNew: () => void;
  isLoading: boolean;
}

const CATEGORY_ICONS: Record<ReflectionMode, typeof Compass> = {
  reflection: Compass,
  summary: BookOpen,
  brainstorm: Lightbulb,
  action: ListChecks,
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function HistorySidebar({
  interactions,
  selectedId,
  onSelect,
  onNew,
  isLoading,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.category === activeFilter;
      const queryLower = searchQuery.toLowerCase().trim();
      if (!queryLower) return matchesFilter;

      const matchesTitle = item.title?.toLowerCase().includes(queryLower);
      const matchesPrompt = item.prompt?.toLowerCase().includes(queryLower);
      const matchesMessages = item.messages?.some((m) =>
        m.content.toLowerCase().includes(queryLower)
      );

      return matchesFilter && (matchesTitle || matchesPrompt || matchesMessages);
    });
  }, [interactions, activeFilter, searchQuery]);

  return (
    <aside
      id="history-sidebar"
      className="w-full lg:w-80 bg-white border border-gray-200 rounded-2xl flex flex-col h-full max-h-[calc(100vh-6rem)] overflow-hidden shadow-xs"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Recent Reflections
            </h2>
            <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {interactions.length}
            </span>
          </div>
          <button
            type="button"
            id="btn-sidebar-new"
            onClick={onNew}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            + Compose
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-2.5">
          <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-history-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries or insights..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "reflection", label: "Reflections" },
            { id: "summary", label: "Summaries" },
            { id: "brainstorm", label: "Brainstorms" },
            { id: "action", label: "Actions" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`filter-tab-${tab.id}`}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors text-xs ${
                activeFilter === tab.id
                  ? "bg-indigo-600 text-white font-medium shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="h-5 w-5 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Syncing Firestore records...</p>
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40 text-gray-400" />
            <p className="text-xs font-medium text-gray-600">
              {searchQuery ? "No matching entries found" : "No reflections yet"}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {searchQuery
                ? "Try a different search term or clear the filter."
                : "Your reflections will be isolated and saved here in Firestore."}
            </p>
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isSelected = selectedId === item.id;
            const Icon = CATEGORY_ICONS[item.category] || Sparkles;
            const messageCount = item.messages?.length || 1;

            return (
              <button
                key={item.id}
                type="button"
                id={`history-item-${item.id}`}
                onClick={() => onSelect(item)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 group ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-900 border-indigo-200 shadow-xs ring-1 ring-indigo-200"
                    : "bg-white border-gray-200/80 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs truncate ${isSelected ? "font-semibold text-indigo-900" : "font-medium text-gray-900"}`}>
                      {item.title}
                    </span>
                    <span className={`text-[10px] shrink-0 ${isSelected ? "text-indigo-500" : "text-gray-400"}`}>
                      {formatRelativeTime(item.updatedAt || item.createdAt)}
                    </span>
                  </div>

                  <p className={`text-[11px] line-clamp-2 leading-relaxed ${isSelected ? "text-indigo-700/80" : "text-gray-500"}`}>
                    {item.prompt}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                    <span className={`capitalize font-medium ${isSelected ? "text-indigo-600" : "text-gray-400"}`}>{item.category}</span>
                    <span className={isSelected ? "text-indigo-300" : "text-gray-300"}>•</span>
                    <span className={isSelected ? "text-indigo-500" : "text-gray-400"}>{messageCount} {messageCount === 1 ? "turn" : "turns"}</span>
                  </div>
                </div>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 mt-1 transition-transform ${
                    isSelected ? "text-indigo-600 translate-x-0.5" : "text-gray-300 group-hover:text-gray-500"
                  }`}
                />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

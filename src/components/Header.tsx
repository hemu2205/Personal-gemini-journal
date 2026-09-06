import { Sparkles, Shield, LogOut, Plus, BookOpen } from "lucide-react";
import type { AuthUserProfile } from "../types";

interface HeaderProps {
  user: AuthUserProfile | null;
  onSignOut: () => void;
  onNewReflection: () => void;
  isEditingNew: boolean;
}

export function Header({ user, onSignOut, onNewReflection, isEditingNew }: HeaderProps) {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900 tracking-tight">
                Reflect AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Firestore Isolated
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden md:block">
              Multi-turn introspective journaling &amp; AI synthesis
            </p>
          </div>
        </div>

        {/* Action Controls & User Account */}
        {user ? (
          <div className="flex items-center gap-3">
            <button
              id="btn-new-reflection"
              onClick={onNewReflection}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                isEditingNew
                  ? "bg-indigo-700 text-white ring-2 ring-indigo-500/30"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>New Reflection</span>
            </button>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User avatar"}
                  className="h-9 w-9 rounded-full border border-gray-200 object-cover ring-2 ring-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs ring-2 ring-white">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-gray-900 line-clamp-1 max-w-[140px]">
                  {user.displayName || "Authenticated User"}
                </p>
                <p className="text-[10px] text-gray-500 line-clamp-1 max-w-[140px]">
                  {user.email || "Private Session"}
                </p>
              </div>

              <button
                id="btn-sign-out"
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Gemini 3.6 Flash Ready
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  logoutUser,
  subscribeToUserInteractions,
  saveInteraction,
  removeInteraction,
} from "./lib/firebase";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { JournalEditor } from "./components/JournalEditor";
import { ConversationView } from "./components/ConversationView";
import { HistorySidebar } from "./components/HistorySidebar";
import type { Interaction, AuthUserProfile, ReflectionMode } from "./types";
import { ShieldCheck } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);
  const [isEditingNew, setIsEditingNew] = useState(true);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{
    prompt: string;
    mode: ReflectionMode;
  } | null>(null);

  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
        setInteractions([]);
        setSelectedInteractionId(null);
        setIsEditingNew(true);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore records isolated to currentUser.uid
  useEffect(() => {
    if (!currentUser?.uid) return;

    setFirestoreLoading(true);
    const unsubscribe = subscribeToUserInteractions(
      currentUser.uid,
      (items) => {
        setInteractions(items);
        setFirestoreLoading(false);
        setFirestoreError(null);
      },
      (err) => {
        setFirestoreError("Could not load past entries from Firestore: " + err.message);
        setFirestoreLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Google Login Handler
  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err: any) {
      console.error("Sign-out error:", err);
    }
  };

  // Currently selected interaction object
  const activeInteraction = interactions.find(
    (i) => i.id === selectedInteractionId
  );

  // Submit new reflection & converse with Gemini
  const handleCreateReflection = useCallback(
    async (prompt: string, mode: ReflectionMode) => {
      if (!currentUser) return;
      setIsSubmitting(true);
      setEditorError(null);
      setPendingDraft({ prompt, mode });

      try {
        // Step 1: Call resilient Gemini backend proxy
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            mode,
            history: [],
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(
            data.message || data.error || "Failed to receive reflection from Gemini."
          );
        }

        // Step 2: Formulate isolated Firestore interaction doc
        const interactionId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const generatedTitle =
          prompt.length > 50 ? prompt.substring(0, 48) + "..." : prompt;

        const newInteraction: Interaction = {
          id: interactionId,
          userId: currentUser.uid,
          title: generatedTitle,
          prompt,
          category: mode,
          messages: [
            {
              id: `msg_u_${Date.now()}`,
              role: "user",
              content: prompt,
              timestamp: Date.now(),
            },
            {
              id: `msg_m_${Date.now()}`,
              role: "model",
              content: data.text,
              timestamp: Date.now() + 1,
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          modelUsed: data.modelUsed || "gemini-3.6-flash",
        };

        // Step 3: Transaction verification - guaranteed Firestore persistence
        await saveInteraction(currentUser.uid, newInteraction);

        // Success - clear draft buffer and display conversation view
        setPendingDraft(null);
        setSelectedInteractionId(interactionId);
        setIsEditingNew(false);
      } catch (err: any) {
        console.error("Reflection submission error:", err);
        setEditorError(
          err.message || "An error occurred while saving your reflection."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser]
  );

  // Retry save / generation if previously failed
  const handleRetryDraft = () => {
    if (pendingDraft) {
      handleCreateReflection(pendingDraft.prompt, pendingDraft.mode);
    }
  };

  // Multi-turn follow-up inside conversation view
  const handleSendFollowUp = async (followUpText: string) => {
    if (!currentUser || !activeInteraction) return;
    setIsSendingFollowUp(true);
    setFollowUpError(null);

    const userMessageId = `msg_u_${Date.now()}`;
    const modelMessageId = `msg_m_${Date.now()}`;

    try {
      // Pass previous conversation messages for multi-turn context
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: followUpText,
          mode: activeInteraction.category,
          history: activeInteraction.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Failed to generate follow-up."
        );
      }

      // Update interaction with new exchange
      const updatedInteraction: Interaction = {
        ...activeInteraction,
        messages: [
          ...activeInteraction.messages,
          {
            id: userMessageId,
            role: "user",
            content: followUpText,
            timestamp: Date.now(),
          },
          {
            id: modelMessageId,
            role: "model",
            content: data.text,
            timestamp: Date.now() + 1,
          },
        ],
        updatedAt: Date.now(),
        modelUsed: data.modelUsed || activeInteraction.modelUsed,
      };

      // Persist updated thread to Firestore
      await saveInteraction(currentUser.uid, updatedInteraction);
    } catch (err: any) {
      console.error("Follow-up error:", err);
      setFollowUpError(err.message || "Failed to send follow-up message.");
      throw err;
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  // Delete an interaction
  const handleDeleteInteraction = async (id: string) => {
    if (!currentUser) return;
    try {
      await removeInteraction(currentUser.uid, id);
      if (selectedInteractionId === id) {
        setSelectedInteractionId(null);
        setIsEditingNew(true);
      }
    } catch (err: any) {
      console.error("Delete interaction error:", err);
    }
  };

  // Global loading skeleton while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-medium text-gray-600">
            Initializing secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f4f6] text-gray-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        user={currentUser}
        onSignOut={handleSignOut}
        onNewReflection={() => {
          setIsEditingNew(true);
          setSelectedInteractionId(null);
        }}
        isEditingNew={isEditingNew}
      />

      {/* Unauthenticated Landing View */}
      {!currentUser ? (
        <main className="flex-1 flex flex-col">
          <LandingPage
            onSignIn={handleSignIn}
            isLoading={authLoading}
            errorMessage={authError}
          />
        </main>
      ) : (
        /* Authenticated Private Dashboard */
        <main id="user-dashboard" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
          {/* History Sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <HistorySidebar
              interactions={interactions}
              selectedId={selectedInteractionId}
              onSelect={(item) => {
                setSelectedInteractionId(item.id);
                setIsEditingNew(false);
              }}
              onNew={() => {
                setIsEditingNew(true);
                setSelectedInteractionId(null);
              }}
              isLoading={firestoreLoading}
            />
          </div>

          {/* Main Working Pane */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Global Firestore Error Notification */}
            {firestoreError && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <span>{firestoreError}</span>
              </div>
            )}

            {/* Privacy indicator badge */}
            <div className="flex items-center justify-between px-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Private collection:{" "}
                  <code className="bg-gray-200/80 px-1.5 py-0.5 rounded text-[11px] text-gray-700">
                    /users/{currentUser.uid}/interactions
                  </code>
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                Rule: request.auth.uid == userId
              </span>
            </div>

            {/* Active view: either New Reflection Composer or Existing Multi-turn Conversation */}
            {isEditingNew || !activeInteraction ? (
              <JournalEditor
                onSubmit={handleCreateReflection}
                isSubmitting={isSubmitting}
                lastError={editorError}
                onRetry={handleRetryDraft}
              />
            ) : (
              <ConversationView
                interaction={activeInteraction}
                onSendFollowUp={handleSendFollowUp}
                onDeleteInteraction={handleDeleteInteraction}
                isSendingFollowUp={isSendingFollowUp}
                followUpError={followUpError}
              />
            )}
          </div>
        </main>
      )}
    </div>
  );
}

import { Shield, Sparkles, Database, Lock, ArrowRight, BookOpen, AlertCircle } from "lucide-react";

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function LandingPage({ onSignIn, isLoading, errorMessage }: LandingPageProps) {
  return (
    <div id="landing-page" className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f3f4f6]">
      <div className="max-w-4xl mx-auto w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12">
          {/* Header Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Shield className="h-3.5 w-3.5 text-indigo-600" />
              OWASP &amp; Firestore Security Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Gemini 3.6 Flash Ready
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight leading-tight mb-4">
                Your Private Space for Meaningful Reflections &amp; AI Synthesis
              </h1>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                Journal openly, explore challenging decisions, and converse with Gemini in multi-turn dialogues. All entries are encrypted and strictly isolated in Cloud Firestore under your private profile.
              </p>

              {/* Error Notice */}
              {errorMessage && (
                <div
                  id="auth-error-banner"
                  className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Authentication Notice</p>
                    <p className="mt-0.5 text-red-700 text-xs">{errorMessage}</p>
                    {errorMessage.includes("popup") && (
                      <p className="mt-2 text-xs text-red-600 underline cursor-pointer" onClick={onSignIn}>
                        Click here to retry authentication.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Primary Call to Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  id="btn-google-signin"
                  onClick={onSignIn}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
                      <span>Authenticating securely...</span>
                    </>
                  ) : (
                    <>
                      {/* Google G Logo SVG */}
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 20.4 7.5 23 12 23z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                      <ArrowRight className="h-4 w-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Federated OAuth authentication. No local passwords are stored or handled.
              </p>
            </div>

            {/* Architecture Highlights Column */}
            <div className="lg:col-span-5 bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Built for Privacy &amp; Resilience
              </h2>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Owner-Bound Firestore Rules</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Strict <code className="text-indigo-800 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">request.auth.uid == userId</code> rules ensure only you can view or edit your entries.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Multi-Turn History Persistence</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Conversations and takeaways are preserved across sessions in Cloud Firestore with zero data leakage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Gemini Resilience Ladder</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Automated fallback cascade across Flash 3.6, 3.1-Lite, and 3.7 for unbroken reflection availability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Google Cloud Run AI Challenge Compliant • Google AI Studio • Cloud Firestore Isolation
        </div>
      </div>
    </div>
  );
}

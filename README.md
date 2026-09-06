# Gemini Reflection & Journaling Hub (Reflect AI)

A private, user-authenticated web application for introspective journaling, multi-turn AI synthesis, and personal growth. Powered by the modern **Gemini 3.6 Flash API** via the `@google/genai` TypeScript SDK and **Google Cloud Firestore**, this application combines thoughtful psychological framing with zero-compromise security: strict user data isolation, federated identity, and server-side secret management.

---

## 🌟 What is Reflect AI?

Reflect AI is designed to solve the "blank page syndrome" and emotional fragmentation of traditional journaling. Rather than maintaining a static, passive diary, Reflect AI offers an interactive, multi-turn thinking partner that helps you process emotions, untangle complex professional decisions, break through creative blocks, and formulate practical micro-steps.

### Core Capabilities
1. **Four Specialized Reflection Modes**:
   - **Deep Reflection**: Compassionate, contemplative inquiry with 1–2 gentle, thought-provoking questions to foster self-discovery.
   - **Summary & Themes**: Synthesizes stream-of-consciousness entries into key psychological themes and mindset takeaways.
   - **Creative Brainstorm**: Dynamic ideation partner proposing exploratory angles and solutions.
   - **Action Steps**: Translates overwhelm or high-level goals into 3 practical, achievable micro-actions you can accomplish immediately.
2. **Multi-Turn Conversation Threads**: Maintain continuous dialogue context with Gemini on any entry, letting you dive deeper or pivot as your thoughts evolve.
3. **Owner-Bound Privacy**: Every journal entry, prompt, and AI response is saved under `/users/{userId}/interactions/{interactionId}` in Cloud Firestore, strictly governed by rule-level ownership validation.
4. **Resilient AI Pipeline**: Features an automated model fallback ladder across `gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash` to handle transient API rate-limits or service spikes transparently.
5. **Productivity & Ownership**: Instant one-click Markdown export, clipboard copying, keyword search, category filtering, and clean document deletion.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | React 18 + TypeScript + Vite | Clean Minimalism theme, responsive layout, reactive state, and accessible interactions. |
| **Styling** | Tailwind CSS v4 | Lightweight modern utility styling with distraction-free neutral canvas. |
| **User Identity** | Firebase Authentication | Federated Google OAuth popup sign-in; zero storage of plaintext passwords or credentials. |
| **Database** | Cloud Firestore | Isolated document storage (`/users/{userId}/interactions/*`) with server-enforced security rules. |
| **Backend Service** | Express + TypeScript | Secure API proxy, request payload sanitization, and resilient Gemini integration. |
| **AI SDK** | `@google/genai` | Modern Google GenAI SDK interfacing with Gemini 3.6 Flash and fallback models. |
| **Secret Management** | Google Cloud Secret Manager | Dynamic injection of `GEMINI_API_KEY` with zero hardcoding in client or source code. |
| **Container & Hosting** | Google Cloud Run | Serverless container execution, scalable to zero with high performance. |

---

## 🔒 Security & Threat Mitigation (OWASP Alignment)

- **A01: Broken Access Control**: Firestore security rules mandate `request.auth.uid == userId`. No user can query, read, update, or delete another user's journal entries.
- **A02: Cryptographic Failures / Secret Exposure**: Client applications never receive `GEMINI_API_KEY`. All LLM calls are proxied through the Express backend running behind Cloud Secret Manager.
- **A03: Injection & LLM02: Sensitive Information Handling**:
  - Request payloads are validated with strict type checks and null-safe destructuring.
  - Data objects are stripped of `undefined` values before persistence to prevent database driver rejections.
- **LLM01: Prompt Injection Defense**: System prompts explicitly designate user entries as introspective data rather than executable instructions.

---

## 🚀 Step-by-Step Configuration & Deployment Guide

### 1. Prerequisites
- A Google Cloud Platform (GCP) project with active billing.
- Google Cloud SDK (`gcloud` CLI) installed and authenticated.
- Node.js 18+ and npm installed locally.

```bash
# Authenticate CLI with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

Enable required Google Cloud APIs:
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

### 2. Secret Management Setup
Store your Gemini API key in Google Cloud Secret Manager and grant read permissions to the default Cloud Run compute service account:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 3. Database Security Configuration (Cloud Firestore)
Ensure Cloud Firestore is initialized in Native Mode in your chosen GCP region. Deploy the owner-bound security rules to ensure complete user isolation:

#### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy rules using the Firebase CLI or Cloud Console:
```bash
firebase deploy --only firestore:rules
```

---

### 4. Local Development
To run the full-stack application locally:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variable in .env
echo "GEMINI_API_KEY=your-gemini-api-key" > .env

# 3. Start unified dev server (Express backend + Vite middleware)
npm run dev
```

Visit `http://localhost:3000` to interact with the application.

---

### 5. Cloud Run Deployment Flow
Build and deploy the application container to Google Cloud Run:

```bash
gcloud run deploy gemini-reflection-hub \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

### 6. Required Campaign Verification Binding
Apply the mandatory challenge label to register your Cloud Run service for automated verification:

```bash
gcloud run services update gemini-reflection-hub \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Verification Checklist

- [x] **Federated Authentication**: User signs in using Google OAuth via Firebase popup; unauthenticated traffic is restricted to the landing view.
- [x] **New Reflection Creation**: Submit thoughts across all 4 reflection modes; verify Gemini response generation with model badge.
- [x] **Multi-Turn Threading**: Send follow-up replies; verify thread continuity and persistence to Firestore.
- [x] **Data Isolation**: Verify each document is saved under `/users/{userId}/interactions/{id}` and inaccessible to unauthorized sessions.
- [x] **Export & Utilities**: Test one-click copy to clipboard and Markdown file download.


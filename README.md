# Gemini Reflection & Journaling Hub

A user-authenticated web application for multi-turn reflective journaling and AI-powered synthesis, powered by the **Gemini 3.6 Flash API** and **Cloud Firestore** with strict user data isolation and Google federated authentication.

---

## Architecture Overview

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Federated Google Sign-In; zero storage of plaintext passwords or raw credentials. |
| **Backend Database** | Cloud Firestore | User-isolated document collection (`/users/{userId}/interactions/*`) with strict security rules. |
| **AI Processing Engine** | Gemini 3.6 Flash API | Multi-turn conversational reflections, summaries, brainstorming, and action micro-steps. |
| **Backend Server** | Express + TypeScript | Proxies Gemini API requests securely; implements resilient model fallback ladder. |
| **Secret Management** | Secret Manager / Env Vars | Dynamically injects `GEMINI_API_KEY` without hardcoding sensitive strings. |

---

## 1. Prerequisites & Environment Setup

1. **Google Cloud Project**: An active Google Cloud project with billing enabled.
2. **Google Cloud SDK (`gcloud`)**: Installed and initialized on your machine.
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Enable Required APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudbuild.googleapis.com
   ```

---

## 2. Secret Management Setup

To protect API keys and eliminate hardcoded strings, store `GEMINI_API_KEY` in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

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

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure complete user isolation. No user can read, list, or write another user's journal entries or AI interactions.

### Firestore Security Rules (`firestore.rules`)
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

Deploy the rules using the Firebase CLI or Google Cloud Console:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```
3. Start the unified dev server (Express + Vite):
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run:

```bash
# Build and deploy service
gcloud run deploy gemini-reflection-hub \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

## 6. Required Campaign Verification Binding

Apply the mandatory challenge label to register your Cloud Run service for automated verification:

```bash
gcloud run services update gemini-reflection-hub \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

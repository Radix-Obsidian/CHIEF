# Gmail Setup Guide

CHIEF needs a Google Cloud project with Gmail API enabled and OAuth 2.0 credentials.

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g., "chief-email")
3. Note the project ID

## 2. Enable APIs

Enable these APIs in **APIs & Services → Library**:

- **Gmail API** — Read/send emails
- **Google People API** — User profile info (email, name)

## 3. Configure OAuth Consent Screen

**APIs & Services → OAuth consent screen:**

1. Select "External" user type (or "Internal" for Workspace)
2. Fill in app name: "CHIEF"
3. Add scopes:
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `openid`
4. Add test users (your email) if in "Testing" publish status

## 4. Create OAuth 2.0 Credentials

**APIs & Services → Credentials → Create Credentials → OAuth client ID:**

1. Application type: **Web application**
2. Name: "CHIEF Web Client"
3. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://your-domain.com/api/auth/callback`
4. Copy **Client ID** and **Client Secret**

Add to your `.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## 5. Set Up Pub/Sub for Push Notifications

Gmail uses Google Cloud Pub/Sub to push notifications when new emails arrive.

### Create a Topic

```bash
gcloud pubsub topics create chief-gmail-push
```

### Grant Gmail Permission

Gmail needs permission to publish to your topic:

```bash
gcloud pubsub topics add-iam-policy-binding chief-gmail-push \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

### Create a Push Subscription

```bash
gcloud pubsub subscriptions create chief-gmail-push-sub \
  --topic=chief-gmail-push \
  --push-endpoint=https://your-backend-url/api/webhooks/gmail \
  --push-auth-service-account=your-service-account@your-project.iam.gserviceaccount.com
```

The `--push-auth-service-account` enables OIDC token verification. Set the audience in your `.env`:

```bash
GMAIL_PUBSUB_TOPIC=projects/your-project/topics/chief-gmail-push
GMAIL_PUBSUB_SUBSCRIPTION=projects/your-project/subscriptions/chief-gmail-push-sub
PUBSUB_VERIFY_TOKENS=true
PUBSUB_AUDIENCE=https://your-backend-url/api/webhooks/gmail
```

### Local Development

For local development, use `PUBSUB_VERIFY_TOKENS=false` since Google can't push to localhost. Use the test endpoint instead:

```bash
POST /api/webhooks/gmail/test?user_id=your-user-id
Authorization: Bearer <supabase-jwt>
```

## 6. Start the Gmail Watch

After OAuth is complete, start watching the inbox:

```bash
POST /api/gmail/watch/start
Authorization: Bearer <supabase-jwt>
```

This tells Gmail to push notifications to your Pub/Sub topic whenever new emails arrive. The watch expires after 7 days and needs renewal — CHIEF handles this automatically.

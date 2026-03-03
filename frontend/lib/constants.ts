export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CALLBACK: "/callback",
  INBOX: "/inbox",
  DRAFTS: "/drafts",
  SETTINGS: "/settings",
  HISTORY: "/history",
} as const;

export const API = {
  AUTH_GOOGLE: "/api/auth/google",
  AUTH_CALLBACK: "/api/auth/callback",
  INBOX_FEED: "/api/inbox",
  DRAFTS: "/api/drafts",
  SETTINGS: "/api/settings",
  PENDING: "/api/inbox/pending",
} as const;

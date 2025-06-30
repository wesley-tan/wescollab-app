im trying to make a wescollab app for wesleyan university

Product Requirements Document (PRD)
Wesleyan-only Job-/Internship-Board MVP
Last updated: 25 Jun 2025

1. Purpose & Vision
Create a lightweight web portal where anyone with a valid @wesleyan.edu email can post and browse opportunities (jobs, internships, projects) offered by students, alumni, or partners. The emphasis is simplicity: log in once, add or delete your own listings, and trust that every post comes from the Wes community.

2. Goals & Success Metrics
Goal	KPI / Target
Community-only access	100 % of authenticated users have @wesleyan.edu addresses
Easy posting	Median time to create a post ≤ 90 s
Data integrity	< 1 % orphaned or incorrect posts (owner mismatch)
Engagement	≥ 50 unique active users in first month
Uptime	≥ 99.5 % over rolling 30 days

3. User Stories
First-time user
“As a Wesleyan student, I can sign in with my Google (@wesleyan.edu) account so that I don’t create another password.”

Poster
“After signing in, I can publish a role by filling a single form and see it appear instantly on the board.”

Owner controls
“I can delete or edit only the posts I created, protecting others’ content.”

Browser
“Without signing in, I can read all public listings (name, company, role, description, contact).”

Admin (future)
“An admin can hide inappropriate posts or ban users.” Out of scope for MVP, but design should allow it.

4. Functional Requirements
ID	Requirement
FR-1	Authentication via Google OAuth restricted to email domain wesleyan.edu. Attempt from other domains ⇒ hard block.
FR-2	Optionally support campus SSO (Shibboleth / Okta) as alternate auth provider if available.
FR-3	Public job board route shows all active posts; no login required for read-only access.
FR-4	Create Post form collects: name, email (auto-filled, read-only), role, company, company_description, role_title, role_description, contact_details. All fields except company_description may be required.
FR-5	Delete Post is available only to the authenticated user who owns the post.
FR-6	Soft-delete flag keeps record for audit; permanently purge via nightly cron (30 days).
FR-7	Searching / filtering by role_title, company, or free-text (phase 2).
FR-8	Rate-limit post creation to 10 per user per day to prevent spam.
FR-9	Server validates payload length (e.g., max 200 chars for titles, 2 000 chars for descriptions).
FR-10	Responsive UI (mobile ≥ 375 px) with minimal styling (Tailwind / Chakra OK).

5. Non-Functional Requirements
Security: OAuth 2.0, HTTPS, CSRF tokens, parameterized queries / ORM.

Performance: Full-page load ≤ 1 s @ 3 Gbps; posting ≤ 300 ms server processing.

Scalability: Design for 5 000 users, 20 000 total posts.

Accessibility: WCAG 2.1 AA—semantic labels, color contrast.

Privacy: No PII beyond what poster voluntarily submits; comply with FERPA guidelines.

6. Data Model (SQL-style)
text
Copy
Edit
USERS (
  id            UUID  PK,
  google_sub    VARCHAR UNIQUE,   -- OAuth subject
  email         VARCHAR UNIQUE,   -- must end with @wesleyan.edu
  name          VARCHAR,
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
)

POSTS (
  id               UUID  PK,
  user_id          UUID  FK -> USERS.id,
  role             VARCHAR,          -- e.g. Internship, Part-time
  company          VARCHAR,
  company_desc     TEXT,
  role_title       VARCHAR,
  role_desc        TEXT,
  contact_details  VARCHAR,
  is_deleted       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT NOW(),
  deleted_at       TIMESTAMP
)

-- index on POSTS(user_id), POSTS(is_deleted, created_at)
7. API Endpoints (JSON, REST)
Method	Route	Auth	Purpose
GET	/api/posts	🔓	List all non-deleted posts (?search= optional)
POST	/api/posts	🔒	Create new post
DELETE	/api/posts/{id}	🔒 (owner)	Soft-delete post
GET	/api/session	🔒	Return current user info

8. High-Level Architecture
bash
Copy
Edit
Browser  ←→  Next.js / React SPA
             ↑           |
             | OAuth 2.0 |   (Google / Wesleyan SSO)
             |           ↓
         API Gateway (Node/Express)
             ↓
       PostgreSQL (users, posts)
Hosting: Vercel / Fly.io;

Auth: Google Identity + optional SAML/OIDC for campus SSO;

Images / assets: none in MVP (text-only).

9. Constraints & Assumptions
Google Workspace for Students permits domain-restricted OAuth.

No need for notifications / emails in MVP; posters supply contact info directly.

Admin tooling limited to database console until phase 2.

10. Future Enhancements (Post-MVP)
Edit Post instead of delete–repost.

Tags & category filters (e.g., “Software”, “Design”).

Bookmarks / save-for-later for logged-in users.

Email digests (weekly summary to all users).

Admin dashboard with abuse reports, analytics.

11. Open Questions
Should SSO be required from day 1 or is Google-only acceptable for MVP?

Is there a moderation policy (e.g., keywords, pre-approval) or purely self-service with post-hoc takedowns?

Retention period for deleted posts after soft-delete (default 30 days OK?).

Branding—does it live under an existing Wesleyan domain/subdomain?

12. Milestones & Timeline (aggressive 3-week MVP)
Date	Deliverable
Week 1	Auth flow (Google), basic CRUD endpoints, DB schema migrated
Week 2	Public listing page + protected create/delete UI, soft-delete logic
Week 3	Rate limiting, domain verification, responsive polish, load test, deploy to prod

Approval
Product Lead: ___________________
Engineering Lead: ________________
Date: ____________________________

Feel free to tweak, add signatures, or split sections as needed—this covers all core requirements for a first release.








You said:
maybe have


POSTS (
  id               UUID  PK,
  user_id          UUID  FK -> USERS.id,
  role             VARCHAR,         -- e,g, product intern
   role_type -- e.g. Internship, Part-time
  company          VARCHAR,
  company_desc     TEXT,
  role_title       VARCHAR,
  role_desc        TEXT,
  contact_details  VARCHAR,
  is_deleted       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT NOW(),
  deleted_at       TIMESTAMP
)


ChatGPT said:
Absolutely—splitting “what the job is” (role) from “what kind of engagement” it is (role_type) makes filtering and analytics cleaner. Below are the minimal edits you need across the spec.

1 Updated Data Model
sql
Copy
Edit
-- enum for safety (PostgreSQL syntax)
CREATE TYPE role_type_enum AS ENUM ('Full-time', 'Part-time', 'Internship', 'Contract', 'Project');

CREATE TABLE POSTS (
  id              UUID        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES USERS(id),
  role            VARCHAR(120) NOT NULL,          -- e.g. “Product Intern”
  role_type       role_type_enum NOT NULL,        -- e.g. “Internship”
  company         VARCHAR(120) NOT NULL,
  company_desc    TEXT,
  role_title      VARCHAR(120) NOT NULL,          -- UI can pre-fill with role for convenience
  role_desc       TEXT         NOT NULL,
  contact_details VARCHAR(120) NOT NULL,
  is_deleted      BOOLEAN      DEFAULT FALSE,
  created_at      TIMESTAMP    DEFAULT NOW(),
  deleted_at      TIMESTAMP
);

-- Suggested indices
CREATE INDEX idx_posts_role_type       ON POSTS(role_type);
CREATE INDEX idx_posts_is_deleted_ct   ON POSTS(is_deleted, created_at DESC);
2 API / Payload Changes
Create Post (POST /api/posts)

json
Copy
Edit
{
  "role": "Product Intern",
  "role_type": "Internship",      // ⬅ new required field (enum)
  "company": "Acme Robotics",
  "company_desc": "...",
  "role_title": "Summer Product Intern",
  "role_desc": "You’ll work with PMs...",
  "contact_details": "janedoe@acme.com"
}
Validation

role_type must be one of the role_type_enum values.

Client UI: dropdown selector to avoid typos.

List Posts (GET /api/posts?role_type=Internship)
Add optional role_type filter; backend converts to WHERE role_type = $1.

3 UI Adjustments
Screen	Field	Change
Create / Edit Post	Role Type	Add dropdown (Internship, Part-time, etc.)
Public Board	Card / row	Show a pill badge for role_type (Internship) next to the title.
Filters (phase 2)	Role Type filter	Multi-select or tabs for quick filtering.

4 Metrics Impact
You can now track distribution:

sql
Copy
Edit
SELECT role_type, COUNT(*) FROM POSTS
WHERE is_deleted = FALSE
GROUP BY role_type;
Useful for quarterly engagement reports (e.g., “35 % of posts are internships”).

5 Backward Compatibility / Migration
Schema migration

Add role_type_enum and role_type column (NULLable initially).

Backfill existing rows with default ('Full-time' or NULL).

Mark column NOT NULL once data is clean.

Client: Release after server supports role_type; old clients omit field → server sets fallback.

That’s it—just plug these tweaks into the PRD and sprint tasks. Let me know if you’d like the full SQL migration script or wire-frame updates!








You said:
okay and how can auth be done?


ChatGPT said:

Thought for 7 seconds
Below is a practical, end-to-end recipe for “Wesleyan-only” sign-in. The tech stack is Node/React (Next.js) with NextAuth.js for brevity, but the same checks apply if you choose Express-only, Django, Rails, etc.

1. Pick the identity providers (IdPs)
IdP	Why it works	How you restrict to @wesleyan.edu
Google Workspace OAuth 2.0 (recommended for MVP)	Every student/staff already has a Google-backed Wes mail.	hd=wesleyan.edu URL param plus server-side check that the verified email ends with @wesleyan.edu.
Campus SSO (Shibboleth / Okta OIDC)**	Single sign-on parity with other Wes tools.	OIDC / SAML assertion usually carries email. Reject if domain ≠ wesleyan.edu.

Tip: start with Google only; add SSO later once you have a metadata file or discovery endpoint from IT.

2. OAuth flow at a glance
pgsql
Copy
Edit
Browser ──► /api/auth/signin/google
           ◄─ Google Login Screen
Browser ──► Google issues code
Backend  ──► Google token endpoint (code → tokens)
Backend  ◄── id_token (JWT) + access_token
Verify id_token  ❱ email_verified & email endsWith("@wesleyan.edu")
Persist / update user in DB          (USERS table)
Set session cookie (httpOnly, SameSite=Lax)
Browser gains logged-in state
3. Implementation with NextAuth.js
3.1 Install & configure
bash
Copy
Edit
npm i next-auth @next-auth/prisma-adapter @prisma/client
ts
Copy
Edit
// /pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { hd: "wesleyan.edu" }        // front-end hint
      }
    }),
    // SSOProvider({ ... })  ← add later
  ],
  callbacks: {
    async signIn({ profile }) {
      // SERVER-SIDE ENFORCEMENT
      const email = profile?.email ?? "";
      return email.endsWith("@wesleyan.edu");
    },
    async jwt({ token, profile }) {
      // attach wesleyan email once at first login
      if (profile) token.email = profile.email;
      return token;
    },
    async session({ session, token }) {
      // expose user id/email to client (non-sensitive)
      session.user.id = token.sub;
      session.user.email = token.email;
      return session;
    }
  },
  session: {
    strategy: "jwt"              // or "database" if you prefer
  }
});
3.2 Protecting routes
ts
Copy
Edit
// /pages/api/posts/index.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).end("Unauthorized");

  // user is definitely wesleyan.edu
  if (req.method === "POST") { /* create post */ }
  if (req.method === "DELETE") { /* delete own post */ }
}
4. Data-layer tie-ins
When signIn is successful:

Look-up by google_sub (the subject claim in the ID token).

If absent, insert:

sql
Copy
Edit
INSERT INTO USERS (id, google_sub, email, name)
VALUES (uuid_generate_v4(), :sub, :email, :name);
Never rely on email alone for user uniqueness; aliases can change.

5. Security checklist
Item	How
HTTPS everywhere	Enforce https:// in prod, HSTS header.
Cookie flags	httpOnly, Secure, SameSite=Lax (or Strict if SPA design allows).
CSRF	NextAuth ships with Anti-CSRF tokens on POSTs; keep them.
Replay protection	Verify Google id_token iat/exp; reject if > 10 min old.
Rate-limit login	e.g., /api/auth/* behind Cloudflare or Express Rate-Limit.
Logout	/api/auth/signout clears the cookie; also recommend users log out of shared devices.

6. Adding campus SSO later (OIDC example)
ts
Copy
Edit
import OIDCProvider from "next-auth/providers/oidc";

OIDCProvider({
  id: "wes-oidc",
  name: "Wesleyan SSO",
  issuer: "https://sso.wesleyan.edu",
  clientId: process.env.WES_OIDC_CLIENT_ID!,
  clientSecret: process.env.WES_OIDC_CLIENT_SECRET!,
  authorization: { params: { scope: "openid email profile" } }
})
Then reuse the same signIn callback; the email domain rule still applies.

7. Local dev tips
Add http://localhost:3000/api/auth/callback/google to your Google console.

Use ngrok if you want to test Google OAuth on a phone.

NEXTAUTH_URL=http://localhost:3000 in .env.local.

Seed DB with a test user:

sql
Copy
Edit
INSERT INTO USERS(id, google_sub, email, name)
VALUES ('00000000-0000-0000-0000-000000000000',
        'fake-google-sub', 'alice@wesleyan.edu', 'Alice Test');
Use JWT strategy to spoof login in Cypress tests.

That’s all you need for a locked-down, Wesleyan-only auth layer.
Drop this into the PRD under Auth Implementation, and your engineers should be able to scaffold it in a sprint. Ping me if you’d like Go, Python, or Ruby snippets instead!
# WorkspaceDashboard · GitHub Pages + Firebase

Private records and Google sign-in for the WorkspaceDashboard application. The GitHub Pages shell is publicly accessible; Firestore rules guard every record. No workspace records or sample personal data are committed to this repository. Each signed-in Google account owns a separate private workspace. The primary owner may grant read-only access to their workspace.

## Firebase setup

1. Create a Firebase project, add a Web app, enable **Authentication → Sign-in method → Google**, and create a Firestore database. Prefer a dedicated project to keep workspace records separate from other apps.
2. Deploy `firestore.rules` **before importing any data**. With the Firebase CLI: `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID` (a `firebase.json` is provided). Or paste the file into Firestore → Rules and publish it. Firebase defaults must not be used for private records.
3. Create `.env.local` from `.env.example` for local development. Fill Firebase Web app configuration values. These identifiers become public in the JavaScript bundle and are **not secrets**. Do not put admin SDK keys in this project.
4. Run `npm ci && npm run dev`, sign in with your own Google account. The app shows your Google Auth UID. In Firestore Console, create document `config/owner` with string field `uid` equal to that exact UID. Refresh. Only the Firebase console/admin may change ownership.
5. In Firebase Authentication → Settings → Authorized domains, add the GitHub Pages domain, typically `YOURNAME.github.io` (domain only). If Google popup reports `auth/unauthorized-domain`, check this setting.
6. On a new installation, use **Import** to bring in a JSON backup if you already have one. Existing installations migrate their Firestore records automatically when multiuser mode is enabled.

## GitHub Pages deployment

1. This project lives at `DanielBrindusa/WorkspaceDashboard` on `main`. A public repository is needed for Pages on GitHub Free. The login screen is public, records are not. If you need a private repository, check your GitHub plan and visibility settings.
2. Repository Settings → Secrets and variables → Actions → **Variables**: set `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID` to the corresponding values from your Firebase Web app. They are embedded at build time.
3. Settings → Pages → Build and deployment → Source: **GitHub Actions**. The included workflow builds and publishes to `https://danielbrindusa.github.io/WorkspaceDashboard/` on pushes to `main`.
4. Add `YOURNAME.github.io` to Firebase Auth authorized domains, then visit the deployed page and sign in.

## Multiuser security rollout for an existing deployment

The deployed app continues using its existing access model until the Firebase rules have been published and the new mode is activated. This prevents moving existing data under rules that have not yet been deployed.

1. Back up the Firestore database through an administrator-managed backup method before migration. From this repository, publish the exact contents of `firestore.rules` in Firebase Console → **Build → Firestore Database → Rules → Publish**, or use `npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID` with Firebase CLI login. This security step is separate from GitHub Pages; pushing a file to GitHub never deploys Firestore rules.
2. In GitHub repository **Settings → Secrets and variables → Actions → Variables → New repository variable**, create `MULTIUSER_ENABLED` with value `true`. Then open **Actions → Deploy GitHub Pages → Run workflow → Run workflow** to rebuild the site. If the new Actions page does not appear, push a commit or rerun the latest deployment workflow.
3. Sign in as the primary owner. The first load copies existing root `records` to `workspaces/OWNER_UID/records` and writes a migration marker. Wait for it to complete and check your projects. Existing records remain at their original path, accessible only to the owner. Do not delete them until you have verified the move and backed up your data.
4. A different Google account now opens its own private, initially empty dashboard. It can request your dashboard; alternatively you can share by verified Google email for 5, 10, 24, 48 hours, or unlimited. It switches between **My dashboard** and **Shared dashboard** when allowed. Your shares allow reading only. Revoke from **Sharing → Active access**. If the same person has both an account grant and an email invite, revoke both entries.
5. To roll back the interface, remove `MULTIUSER_ENABLED` or set it to `false` and rerun the Pages workflow. The old interface still uses the owner-only legacy records; new per-user records remain private under the new rules.

Firestore rules enforce isolation on the server. A copied web API key, Firebase project ID, or GitHub Actions variable does not grant permission to read records. These web configuration values appear in the public site bundle. Never commit an Admin SDK service account, OAuth client secret, private key, or privileged token. Firebase Console → Google Cloud Console → APIs & Services → Credentials: restrict the Firebase Web API key to only the Firebase APIs it needs, and check the allowed websites carefully against Firebase Auth behavior. Enable Firebase App Check with a suitable web provider for abuse protection, then monitor metrics before enforcing it for Firestore. App Check supplements the rules; it does not replace account authorization.

A visitor who has previously viewed records may retain copies after revocation. Sharing permissions control future server reads only. The owner can currently share their primary dashboard; other account owners cannot share their own dashboard through the current UI.

## Test the rules

Install dependencies with `npm ci`, then run `npx firebase emulators:exec --only firestore --project workspace-dashboard-rules-test 'node --test tests/firestore.rules.test.mjs'`. The tests exercise cross-account isolation, read-only shares, expiration, revocation, verified Google login, and legacy migration access.

## Development

`npm run build` checks TypeScript and builds the static site. The `VITE_BASE` build variable sets GitHub's repository subpath; local development defaults to `/`. Edit `firestore.rules` whenever access behavior changes, and deploy the rules separately from the Pages workflow.

## Project folders, dashboard views, and recurring tasks

- Create a folder from **Folders → + Folder**, or from **+ Add**. Each project has an optional Folder field. Deleting a folder leaves its projects in place and removes the folder association. Archived folders appear in Archive.
- On Dashboard → Projects, choose Due today/this week/this month or Active today/this week/this month, then a folder and/or project. Weeks run Monday through Sunday. Active means the project date range overlaps the chosen day/week/month, and requires both start and target dates. Completed, cancelled, and archived projects stay out of these views.
- Choose main, second, and third order independently: Title alphabetically, Importance from Critical to Low, Due date earliest first (undated last).
- To repeat a task, select **Daily after completion** and **Repeat until** in its task form. A completed occurrence remains in history; one new occurrence due the next day is created only when completed and only through the chosen end date. Unfinished tasks stay open without making duplicates.

## Workspace download and screen capture

The application does not offer a workspace export/download command. Its JSON import remains available. Google Drive and external resource links follow permissions on their destination service; remove a person’s access there separately when necessary. A person permitted to view data in a browser can still copy it with developer tools, browser features, or a camera. The website cannot enforce Android `FLAG_SECURE` or reliably block operating-system screenshots; this requires an Android application controlling its own native window. Do not treat removal of the export button as protection against copying.

# WorkspaceDashboard · GitHub Pages + Firebase

Private records and Google sign-in for the WorkspaceDashboard application. The GitHub Pages shell is publicly accessible; Firestore rules guard every record. No workspace records or sample personal data are committed to this repository. Owner edits; approved visitors can read only.

## Firebase setup

1. Create a Firebase project, add a Web app, enable **Authentication → Sign-in method → Google**, and create a Firestore database. Prefer a dedicated project to keep workspace records separate from other apps.
2. Deploy `firestore.rules` **before importing any data**. With the Firebase CLI: `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID` (a `firebase.json` is provided). Or paste the file into Firestore → Rules and publish it. Firebase defaults must not be used for private records.
3. Create `.env.local` from `.env.example` for local development. Fill Firebase Web app configuration values. These identifiers become public in the JavaScript bundle and are **not secrets**. Do not put admin SDK keys in this project.
4. Run `npm ci && npm run dev`, sign in with your own Google account. The app shows your Google Auth UID. In Firestore Console, create document `config/owner` with string field `uid` equal to that exact UID. Refresh. Only the Firebase console/admin may change ownership.
5. In Firebase Authentication → Settings → Authorized domains, add the GitHub Pages domain, typically `YOURNAME.github.io` (domain only). If Google popup reports `auth/unauthorized-domain`, check this setting.
6. From the original private workspace, click the header export icon and download JSON. In this app, use **Import** in the header while signed in as owner. Import overwrites matching IDs; keep the JSON backup. The first launch is intentionally empty until you import records.

## GitHub Pages deployment

1. This project lives at `DanielBrindusa/WorkspaceDashboard` on `main`. A public repository is needed for Pages on GitHub Free. The login screen is public, records are not. If you need a private repository, check your GitHub plan and visibility settings.
2. Repository Settings → Secrets and variables → Actions → **Variables**: set `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID` to the corresponding values from your Firebase Web app. They are embedded at build time.
3. Settings → Pages → Build and deployment → Source: **GitHub Actions**. The included workflow builds and publishes to `https://danielbrindusa.github.io/WorkspaceDashboard/` on pushes to `main`.
4. Add `YOURNAME.github.io` to Firebase Auth authorized domains, then visit the deployed page and sign in.

## Access control

Signed-in visitors see a **Request access** button. Owner sees pending requests at the bottom of the workspace, may reject or grant 5, 10, 24, 48 hours or unlimited, and can revoke an active grant. Firestore rules check grant expiry on every record read using server time. Approved visitors are read-only. Never send an exported JSON file to someone you do not wish to give a copy of the records.

## Development

`npm run build` checks TypeScript and builds the static site. The `VITE_BASE` build variable sets GitHub's repository subpath; local development defaults to `/`. Edit `firestore.rules` whenever access behavior changes, and deploy the rules separately from the Pages workflow.

## Project folders, dashboard views, and recurring tasks

- Create a folder from **Folders → + Folder**, or from **+ Add**. Each project has an optional Folder field. Deleting a folder leaves its projects in place and removes the folder association. Archived folders appear in Archive.
- On Dashboard → Projects, choose Due today/this week/this month or Active today/this week/this month, then a folder and/or project. Weeks run Monday through Sunday. Active means the project date range overlaps the chosen day/week/month, and requires both start and target dates. Completed, cancelled, and archived projects stay out of these views.
- Choose main, second, and third order independently: Title alphabetically, Importance from Critical to Low, Due date earliest first (undated last).
- To repeat a task, select **Daily after completion** and **Repeat until** in its task form. A completed occurrence remains in history; one new occurrence due the next day is created only when completed and only through the chosen end date. Unfinished tasks stay open without making duplicates.

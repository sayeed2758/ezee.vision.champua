EZEE VISION CHAMPUA — Website CMS (Free-first setup)
====================================================

FILES
-----
index.html          Public homepage.
admin.html          CMS editor, Firebase Auth, Firestore publish/read-back verification.
public-cms.js       Loads the live Firestore document and renders it on the homepage.
default-content.js  Original fallback website content.
firebase-config.js  Firebase web-app configuration; Storage bucket is optional.
firestore.rules     Firestore rules for the public read/admin-only write document.
api/upload-image.js Vercel serverless endpoint that stores photos in the GitHub repository.
storage.rules       Legacy Firebase Storage rules; NOT USED by this free image workflow.

IMPORTANT: ZERO-COST IMAGE WORKFLOW
-----------------------------------
This version does not use Firebase Storage. Images chosen in the CMS are compressed in
browser, then sent to /api/upload-image. That Vercel function verifies the Firebase ID
token and writes the JPEG into assets/uploads/ in this GitHub repository using a secret
GitHub token held only in Vercel Environment Variables. Firestore stores the public image
URL alongside the other website content.

The free tiers and quotas of GitHub, Vercel, and Firebase still apply. Do not activate
paid billing just to use Firebase Storage; this workflow does not require it.

FIREBASE SETUP
--------------
1. In Firebase Console, open the project used by this website.
2. Authentication > Sign-in method: enable Email/Password.
3. Authentication > Users: create/use the admin account. Verify its email, then sign in
   to /admin.html. Firestore rules only permit the configured verified admin email.
4. Firestore Database: create a database if needed. Publish the contents of firestore.rules.
   The admin email in the current rules is creativesayeedd@gmail.com.
5. In firebase-config.js, preserve the Firebase web-app configuration for this project.
   These values are public frontend identifiers; never put a service-account private key here.
6. Add the Vercel deployed domain to Firebase Authentication > Settings > Authorized domains
   if sign-in reports an unauthorized domain.

VERCEL ENVIRONMENT VARIABLES FOR IMAGE UPLOAD
---------------------------------------------
Set these in Vercel > Project > Settings > Environment Variables. Apply to Production
(and Preview too only if you actively test uploads on Preview):

GITHUB_TOKEN       Fine-grained personal access token; only the ezee.vision.champua repo,
                   Contents: Read and write. Keep this Secret. Never place it in frontend code.
GITHUB_OWNER       sayeed2758
GITHUB_REPO        ezee.vision.champua
GITHUB_BRANCH      main
FIREBASE_API_KEY   apiKey from firebase-config.js (the Web app API key)
ADMIN_EMAIL        creativesayeedd@gmail.com

After changing any environment variable, redeploy the Vercel project. A fine-grained
GitHub token with an expiry must be rotated before expiry, then update GITHUB_TOKEN and
redeploy. Text-only Firestore publishing does not depend on the GitHub token; photo upload does.

PUBLISH WORKFLOW
----------------
1. Open /admin.html.
2. Open Cloud setup and sign in with the verified admin email.
3. Wait for the latest cloud check. If the local editor differs from the live version, make
   a JSON backup first if you need it, then use “Load latest cloud” to start from live data.
4. Edit the desired fields. The editor autosaves a local draft, but that alone is NOT a publish.
5. Press Publish. If the draft differs from live content, the CMS asks for confirmation because
   publishing replaces the whole site/content document.
6. The CMS writes to Firestore and then reads site/content back from the server. The success
   message is shown only after the read-back matches the intended content.
7. Check the public homepage. For a temporary diagnostic badge, open the homepage with
   ?debug-cms=1. It reports whether live Firestore, the local preview draft, or fallback content
   was used. Remove the query string after checking.

LOAD LATEST CLOUD
-----------------
The editor starts from the current browser's saved draft/default content so unsynced changes
are not discarded silently. After sign-in, the CMS compares that editor with the live document.
Use “Load latest cloud” to replace the editor with the latest published Firestore content. If
there are local edits you want to keep, first use Download backup JSON. A browser draft is local
to that browser/device and is not itself live for other visitors.

IMAGE UPLOAD TROUBLESHOOTING
----------------------------
- Photo upload returns 503: one or more Vercel environment variables above are missing, or the
  environment variables were saved but the project was not redeployed.
- Photo upload returns 401/403: sign in again, verify the email, check ADMIN_EMAIL, and confirm
  the GitHub token has Contents: Read and write on this exact repository.
- Photo upload returns 404 from GitHub: check the owner, repository name and branch exactly.
- Text changes can be published using public HTTPS image URLs even if GitHub photo uploading
  is not configured. Do not use local-only data:image URLs for a public photo; the CMS will try
  to send them through the GitHub upload endpoint before saving the cloud document.
- Firebase Storage and storage.rules are not used in this setup.

FIRESTORE TROUBLESHOOTING
-------------------------
- “permission-denied”: verify the signed-in email is creativesayeedd@gmail.com, verify the account
  email in Firebase Authentication, and confirm the active rules match firestore.rules.
- “cloud state could not be confirmed”: use Cloud setup > Load latest cloud and check your
  connection. Publishing is blocked until the current document can be read from the server.
- If success is shown, the CMS should read the saved document back and confirm it matches.
  If it cannot verify, it will say the write may have reached Firestore and will not falsely claim
  that nothing was saved.
- In the public website, append ?debug-cms=1 to show which content source was used and the
  Firestore project/document it attempted to read. The diagnostic is only shown with that query.

SECURITY NOTES
--------------
- Firestore public reads are only permitted for site/content; write/delete are restricted to the
  verified configured admin email. Do not change the rules to allow unrestricted public writes.
- GITHUB_TOKEN belongs only in Vercel Secret environment variables. Never commit it or share it
  in screenshots/chat. If exposed, revoke it immediately and create a replacement.
- The admin.html URL is not secret; Firebase Auth and rules enforce write access.
- Keep a JSON backup before bulk edits. A published document replaces the entire site/content
  document, so the confirmation prompt matters.

ANDROID WORKFLOW
----------------
Use Chrome on Android. In GitHub, replace the files listed in FILES-TO-REPLACE.txt in the
repository root; commit the changes and wait for Vercel to deploy. Then sign in to /admin.html,
Load latest cloud, edit, Publish, and verify the public homepage with ?debug-cms=1 if needed.

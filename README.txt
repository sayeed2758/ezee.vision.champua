EZEE VISION CHAMPUA — Website + Admin Control Room
===================================================

WHAT IS INCLUDED
----------------
index.html          Public coaching portfolio homepage (3D cards, animations, responsive layout)
admin.html          Website admin panel / content management system
public-cms.js       Loads published website content and renders it into the homepage
default-content.js  Editable default content used before the first cloud publish
firebase-config.js Firebase web-app settings (you must fill these in for cloud publishing)
firestore.rules     Firestore read/write security rules template
storage.rules       Image storage security rules template

ADMIN PANEL
-----------
After deployment, open: https://YOUR-DOMAIN/admin.html
Use the admin panel to manage:
- Brand name, tagline, logo badge text, website theme colours
- Hero announcement, headline, description and buttons
- Course cards (add, remove, edit, colour and visibility)
- Teaching method and its points
- Coaching journey story and timeline milestones
- Founder/educator photo, name, qualifications, quote and strengths
- Additional teacher profiles and teacher photos
- Gallery images, titles and captions
- Student/parent testimonials
- WhatsApp, other contact numbers, address, email, map link and footer
- SEO title/description and show/hide controls for homepage sections
- JSON backup / restore of all website content

LOCAL DRAFT VS LIVE PUBLISH
---------------------------
The panel can edit and save a local draft without Firebase. That local draft is saved in the current browser only. Preview opens index.html?preview=1 and reads that browser draft.

To publish changes so EVERY website visitor can see them, complete the Firebase steps below. Once Firebase is connected, use Cloud setup > Sign in, and then Publish. The public homepage reads the published record from Firestore. Uploaded photographs are stored in Firebase Storage. Do not mistake a local draft for a public/live publish.

FIREBASE SETUP (ONE-TIME)
-------------------------
1. Open https://console.firebase.google.com/ and create a Firebase project (or choose an existing one).
2. Register a Web App in Project Settings > General > Your apps. Copy the firebaseConfig object Firebase provides.
3. Open firebase-config.js and replace each placeholder with the matching values from your own web-app configuration. Copy the storageBucket value exactly as Firebase shows it. Do not paste private server credentials or service-account keys into this file.
4. In Firebase Console > Authentication > Sign-in method, enable Email/Password. In Authentication > Users, create the admin account using your own email and a strong unique password. The panel has no public account-registration page.
5. If necessary, add your deployed Vercel domain under Authentication > Settings > Authorized domains.
6. In Firebase Console > Firestore Database, create a database. Open its Rules tab and paste the content from firestore.rules. The supplied rules file is configured for creativesayeedd@gmail.com; verify that this matches your verified Firebase admin account, then Publish the rules.
7. In Firebase Console > Storage, create a bucket. Open Storage > Rules, paste storage.rules, verify that the rule email is the same admin email, and Publish the rules.
8. Upload every file in this folder to the root of your GitHub repository, including public-cms.js, default-content.js, firebase-config.js, admin.html, index.html and the rule files. Commit/push, then deploy or wait for Vercel's deployment to finish.
9. Open your deployed website, then /admin.html. In Cloud setup, sign in with the admin email and password. On the first sign-in the panel sends an email-verification link; verify it, then sign in again.
10. Edit content, save a local draft, Preview, then Publish to website. Open the public homepage in another browser/incognito window to confirm the cloud-published content.

SECURITY NOTES
--------------
- Firestore allows public READ access only to site/content because the public homepage needs to display it. Writes are restricted by the rules to the configured verified admin email. Other Firestore documents are denied by default.
- Storage allows public READ access to site-assets so website visitors can see published images. Uploads are restricted to the configured verified admin email and image files under 8 MB.
- Do not change the rules to allow unrestricted public writes. Never put a Firebase service-account private key in the public website.
- This is a client-side static website, not a server-rendered app. Admin access is enforced by Firebase Authentication and the published Firebase rules, not by hiding the admin.html URL.
- Firebase usage may have quotas or billing requirements depending on your project and current Google plan. Review Firebase Console billing/usage before publishing many large images.

PHOTO UPLOAD NOTES
------------------
Choose JPG, PNG, or another browser-supported image in the Educator or Gallery section. The panel resizes/compresses the photo. In local mode it stores a compressed data URL in the draft; once signed in with Firebase, uploaded photos go to Firebase Storage. Cloud publishing converts any remaining locally stored images to Storage URLs before saving the website content.

BACKUP / RESTORE
----------------
Use Download backup JSON before major edits. Import backup JSON to restore a prior content set. Image data may make a backup file large. Keep backups private if they contain unpublished staff photos or personal details.

ANDROID WORKFLOW
----------------
You can use this from Android Chrome after the folder is deployed to Vercel. Upload/replace files in your GitHub repository using the mobile browser. Once set up, the day-to-day workflow is only: open /admin.html > edit > preview > publish. For first-time Firebase setup, keep this README open while configuring Firebase Console.


TROUBLESHOOTING PUBLISH
-----------------------
The admin panel now shows a Publishing… state and a more specific error. If image upload fails, create Firebase Storage and publish storage.rules. If Firestore denies the write, create Firestore Database and publish firestore.rules. Both rule files are configured for creativesayeedd@gmail.com; change this if your actual verified admin email is different. See FIREBASE-FIX-STEPS.txt for the exact steps.

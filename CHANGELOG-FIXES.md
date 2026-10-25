# Fix package changes

- Added a manual `Load latest cloud` action to prevent accidental publishing from stale browser-local content.
- Added a Firestore server read check after sign-in, local-vs-cloud comparison, and overwrite confirmation.
- Added post-publish `getDocFromServer()` read-back verification; success is shown only after the saved content matches.
- Added more useful Firestore error messages and preserved the distinction between write acknowledgment and read-back verification failure.
- Public homepage now reads via `getDocFromServer()` and has an opt-in diagnostic badge using `?debug-cms=1`.
- Removed `storageBucket` as a required check for Firestore-only configuration.
- Rewrote setup/troubleshooting instructions to remove outdated Firebase Storage requirements and document Vercel/GitHub environment variables.

## Not claimed as tested
The ZIP has static code/syntax/package validation only. The live Firebase and Vercel project was not available to execute a real hosted publish test from this environment. Follow `FILES-TO-REPLACE.txt` and verify the live Firestore document after deployment.

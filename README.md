# SmileCare Clinic Management Web App

This is an installable, responsive web-app frontend for the SmileCare Dental Studio demo. It can be hosted on GitHub Pages. The app shell can be cached by the browser; live clinic records still require an internet connection and configured n8n APIs.

## Included screens
- Overview
- Appointments (search, filter, status update UI)
- Patients (derived from appointment records)
- Reviews
- Reports

## Shared clinic login
The frontend is set up for **one shared clinic email/password account** using Firebase Authentication. Create one Firebase Authentication user for the clinic and share those credentials only with authorised staff. Do not put the password in these files.

## Before live deployment
This package is a frontend starter, not a connected production system. The Firebase and n8n settings are placeholders.

1. Create a Firebase project and enable Email/Password under Authentication.
2. Create one clinic login user in Firebase Authentication.
3. Copy the Firebase web app config into `app.js` (`FIREBASE_CONFIG`).
4. Create two n8n production API webhooks and put their URLs in `API` in `app.js`:
   - `dashboard`: returns JSON with `appointments`, `reviews`, and optionally `patients` arrays.
   - `updateAppointment`: accepts `{ action: "updateAppointmentStatus", bookingId, status }`.
5. **Secure the n8n endpoints before using real patient data.** Verify the Firebase ID token server-side on every request, reject invalid/expired tokens, and allow only the clinic account UID. Do not rely on hiding the webhook URL or checking a token in browser JavaScript. Configure CORS for your GitHub Pages origin.
6. Test read, status update, invalid login, and access from a second device before clinic use.
7. Upload all files in this folder to the root of your GitHub Pages repository. Keep `index.html` at the repository root.

## Install on a device
Open the deployed HTTPS website in a supported browser. Use the browser's **Install app** option or **Add to Home Screen**. The install button appears when the browser supports the install prompt.

## Important limitations
- Dashboard data will not appear until the n8n API endpoints are built and configured.
- The Patients view is currently generated from appointment rows; it is not a separate editable patient database.
- The PWA caches the app shell only. It does not cache patient records offline.
- A shared login is convenient but gives all staff the same access. Change the password when access should be revoked.
- Use HTTPS and restrict the n8n API to authenticated requests before entering real patient information.

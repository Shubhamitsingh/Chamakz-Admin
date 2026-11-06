# Data connection

This admin panel is not connected to a Firebase project. Pages currently use local mock data so you can use the UI.

The previous Firebase project keys and CLI files were removed from this codebase only. Nothing was changed in Firebase Console.

## Use the panel now

Sign in with any email and password, for example:

- Email: `admin@chamakz.com`
- Password: `admin123`

## Connect a new Firebase project later

1. Copy `.env.example` to `.env.local`.
2. Fill in `VITE_FIREBASE_*` from a new Firebase web app.
3. Restart the Vite dev server.

When those variables are present, the real Firebase SDK is used instead of mock data.

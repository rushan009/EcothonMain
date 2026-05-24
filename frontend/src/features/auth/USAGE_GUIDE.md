# How to wire the auth screens

Use this folder as the shared auth logic layer, then keep screen UI in the existing `screens/auth` files.

## Signup screen
- Import `useAuthForm` from `src/features/auth`.
- Track `name`, `email`, `phone`, `password`, and `role` there.
- Call `registerUser(toRegisterPayload(form))` when the user taps Continue.

## Login screen
- Use a smaller form state with `phone` and `password` only.
- Keep `useState` local if the screen is simple, or create a second hook later if needed.

## Good next step
If you want, I can next show you the exact lines to replace in `AuthSignupScreen.js` and `AuthLoginScreen.js` so they use this new folder without rewriting the UI.

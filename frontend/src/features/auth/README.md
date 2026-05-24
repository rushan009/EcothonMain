# Auth Feature

This folder is a small frontend auth layer for the signup/login flow.

## What to connect
- `authApi.js` sends requests to the backend.
- `useAuthForm.js` tracks input state with `useState`.
- `authMapper.js` turns screen state into the backend payload.

## Backend endpoint currently available
- `POST /api/auth/register`
- `POST /api/auth/login`

## Suggested wiring order
1. Keep screen UI in `src/screens/auth/`.
2. Use `useAuthForm()` inside the signup/login screens.
3. Call `registerUser(toRegisterPayload(form))` on submit.
4. Show `error` from the hook in the screen.
5. Use `loginUser()` for the sign-in screen and route by returned role.

## Example usage
```js
const { form, setField, loading, error } = useAuthForm();

// setField('phone', value)
// registerUser(toRegisterPayload(form))
```

## Note
`loginUser()` is now wired to the backend login route and returns the signed-in user, access token, and refresh token.

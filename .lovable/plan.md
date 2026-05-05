## Goal
Rename the "Register" nav tab to "Sign In". After signing in with a phone number, show the donor's profile. If the phone isn't registered yet, allow them to register from the same page; once registered they're treated as signed in and see the profile.

## UX flow on `/register` (now the Sign In page)

1. **Signed out (default)**: Show a "Sign In" card with a 10-digit phone input + "Sign In" button.
   - If phone matches a registered donor → store the phone in `localStorage` (`bloodbank_donor_phone`) and switch to profile view.
   - If phone is valid but not registered → show inline message "No donor found with this number" and a "Register as new donor" button that reveals the existing registration form (prefilled with the entered phone).
2. **Signed in**: Show a **Profile card** with all donor details (name, gender, dept, year, blood group, last donated, address, phone), plus:
   - "Update Last Donated Date" button (opens a small date input + save, calls `updateDonorLastDonated`).
   - "Sign Out" button (clears the stored phone, returns to sign-in view).
3. New registrations auto-sign-in (store phone, show profile).

## Files to change

- **`src/components/Navbar.tsx`** — change the `/register` link label from "Register" to "Sign In" (both desktop and mobile arrays).
- **`src/lib/store.ts`** — add tiny helpers:
  - `SIGNED_IN_KEY = "bloodbank_donor_phone"`
  - `getSignedInPhone()`, `setSignedInPhone(phone)`, `clearSignedInPhone()`
- **`src/pages/Register.tsx`** — rewrite as a dual-mode page:
  - Top heading: "Sign In" / "My Profile" depending on state.
  - Sign-in mode: phone input + Sign In button + "Register as new donor" branch.
  - Profile mode: read-only details card + Update Last Donated dialog + Sign Out.
  - Reuse existing form JSX for the registration branch; on successful `saveDonor` call `setSignedInPhone(phone)` and switch to profile view (no navigate to `/donors`).

## Memory updates
Update `mem://index.md` Core to reflect: "Register tab is now Sign In; donors sign in by phone to view/edit their own profile."

## Out of scope
- No backend / Lovable Cloud changes (data stays in localStorage as today).
- Admin login flow is unchanged.
- Donor List privacy gate is unchanged (already requires phone for non-admins).

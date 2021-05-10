# [4.0.0-beta.14] - 2021-05-11
## New Features
- Added possibility to opt-in into Proton's Early Access program under the Settings dropdown
- Added a ProtonVPN section that can be accessed via the app-switcher
- New theme available: Legacy

## Improvements
- General design & UI/UX enhancements
- User onboarding flow improvements
- Updated themes' naming

---

# [4.0.0-beta.13] - 2021-04-21
## Improvements
- Added multiple theme support
- New themes available: Light, Monokai, & Contrast
- Redesigned illustrations and refined the look and feel of various parts of the app
- Reorganized settings to make them easier to find
- Account registration and sign in flow improvements
- New subscription customization options and interface

---

# [4.0.0-beta.12] - 2021-03-18
## Fixes 
- Fixed a discount miscalculation when switching VPN plans (no impact on payment amount)

---

# [4.0.0-beta.11] - 2021-03-10

## Improvements
- Various UI improvements

---

# [4.0.0-beta.10] - 2021-02-25

## Improvements
- Moved storage display to the sidebar
- Prepared support for opting into early access programs
- Added warning when removing the primary admin role from another user

---

# [4.0.0-beta.9] - 2021-01-26

## Fixes
- Fixed a bug blocking some users from upgrading their subscription
- Display organization password prompt when administrator privileges required
- Minor accessibility fix on vocalization bug

## Improvements
- Prepared support for new address key encryption scheme

---

# [4.0.0-beta.8] - 2021-01-21

## Fixes
- Added retry mechanism to mitigate a bug during sign up causing elements failing to load
- Removed deprecated x-pm-apiversion header in client requests

## Improvements
- Text improvements for added clarity in the organization settings section and in the authentication logs
- Minor UI adjustments of icons' placement and alignment
- Prepared support for unsubscribing from newsletters without having to sign in

---

# [4.0.0-beta.7] - 2020-12-07

## Improvements

- Made it more difficult to accidentally delete the wrong user for multi-user account holders

## Fixes

- Various small bugs and inconsistencies with custom domain configuration
- Confusing wording used when settings timezone format
- A glitch causing display name to present over other elements in the application header

---

# [4.0.0-beta.6] - 2020-11-30

## Fixes

- Copy button not working for the value field during custom domain configuration
- A crash on the subscription screen if credit card details are stored in the wrong format
- Navigation header disappearing when viewing on mobile
- Banner messages not aligning to the top of the window
- Gift code field unnecessarily limiting character limit 

---

# [4.0.0-beta.5] - 2020-11-09

## Improvements

- Added new welcome screens to explain how to navigate between apps and Account settings
- Added access to the welcome screens from the help menu
- Updated the sign-in screen to remember the previously set language
- Added a back button to the sign-in screen, if coming from the account switcher

---

# [4.0.0-beta.4] - 2020-11-04

## Improvements

- Ordered accounts alphabetically by username on the account switcher screen
- Added a white boarder to the 2FA QR code to make it work more reliably with some QR readers
- Updated the storage consumption alert to start displaying at 80% instead of 90%
- Clarified an alert presented to sub-users with 80% or greater storage capacity consumed

## Fixes

- Reveal icon missing from mailbox password screen
- Donation option incorrectly being available to organization sub-users
- Administrators not being able to delete sub-users with administrative privileges
- Color issue with warning banners
- Link to subscription and billing details being shown to sub-users
- Link to organization settings being shown to sub-users
- Modals auto-focussing on cancel buttons instead of confirm buttons
- Plan not displaying after changing subscription
- Similar errors displaying multiple times simultaneously
- Cancel button incorrectly being shown on 2FA completed screen

---

# [4.0.0-beta.3] - 2020-10-27

## Fixes

- Users with overdue invoices being asked to sign in again
- Wording when deleting messages in some non-English languages

---

# [4.0.0-beta.2] - 2020-09-30

## Fixes

- Minor UI/UX bug fixes following the deployment of SSO

---

# [4.0.0-beta.1] - 2020-09-29

## Added

-   Sign in once to access all Proton services (ProtonMail, ProtonCalendar, and ProtonDrive)
-   Open Proton apps in a new tab or window without signing back in
-   Choose your preferred Proton Account recovery method: email address or phone number
-   New authentication flow to sign in or create a Proton Account
-   Switch between Proton apps from the app switcher
-   New dropdown menu in ProtonAccount to:
    -   Switch between multiple accounts
    -   Manage account-level settings
    -   Switch to dark mode

Read our blog post on [Proton Account beta release](https://protonmail.com/blog/sso-beta).

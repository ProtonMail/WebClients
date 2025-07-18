### Version 1.32.3

- Fix search query resets during vault switch
- Fix secure link note view on Firefox

### Version 1.32.2

- Fix date fields accounting for TZ offset

### Version 1.32.0

- Add support for custom item types
- Improve note item screen
- Preserve custom item types when importing
- Minor UX improvements
- Support extra fields on alias, credit-cards & note items
- Fix "attached-to-login" alias form validation
- Fix auto-scroll when creating extra-field
- Fix item auto-select conflict with filters after item creation
- Fix destination vault change during item creation with file attachment

### Version 1.31.5

- Set default pass theme to system preference
- Improved in-app onboarding on first login
- Improved i18n/theme hydration on boot
- Fix managers/admins not able to move items to another vault
- Fix electron/os/pass theme conflicts
- Fixed minor UI/UX issues

### Version 1.31.4

- Add support for OpenPGP grammar check

### Version 1.31.3

- Add Proton Anniversary 2025 offer
- Fix extra-password authentication edge-case

### Version 1.31.2

- Improve invite members modal UX
- Improve password prompt text by taking into account second password
- Rename vault/item "admin" to "manager"
- Make app header more easily draggable
- Improve biometrics unlock error reporting

### Version 1.31.1

- File attachments improvements
- Fine-tune click-to-copy mechanism

### Version 1.31.0

- Add file attachments support
- Improve data synchronisation
- Improve exporters & importers

### Version 1.30.1

- Bug fixes and performance improvements

### Version 1.30.0

- Redesign side menu UI
- Allow B2B admins to disable vault creation for members

### Version 1.29.8

- Fix multi-select dropdown blocking unselect action

### Version 1.29.5

- Support coupons from in-app notifications

### Version 1.29.4

- Improve in-app messaging triggers
- Send B2B Pass Monitor reports
- Enforce B2B item sharing policy
- Fine-tune invite recommendations
- Update alias prefix validation error messages
- Preserve history when moving items
- Allow users to edit mailbox addresses from settings
- Block concurrent vault move/delete actions
- Fine-tune PassMonitor UX
- Fix shared counter for vault owners
- Fix all items counter accounting for trashed shared-with-me items
- Fix invite recommendations UX breaking on small screens
- Fix Dark Web Monitoring not suggesting login items with username & email
- Fix wrong error message on extra password request connectivity error
- Fix optimistic items being draggable in bulk mode

### Version 1.29.3

- Re-enable offline support for SSO users
- Re-enable password lock support for SSO users
- Re-enable biometrics lock support for SSO users
- Re-enable exporting capabilities for SSO users

### Version 1.29.2

- Reduce invite creation batch size
- Add ability to redeem lifetime coupon from settings
- Improved feedback UI (moved to settings)
- Disable auto password lock creation for SSO users
- Fix text ellipsis regressions introduced in 1.29.0
- Fix share access management for free users from item's view

### Version 1.29.1

- Fix address validator for organization members

### Version 1.29.0

- Add support for item sharing
- Revamp vault sharing
- Fix SSO specific authentication flow
- Fix advanced alias management copy

### Version 1.28.0

- Improve react app performance
- Improve app navigation and routing
- Improve UI for pending external invitations
- Improve in-app notifications UX
- Wipe search filter on vault change
- Allow searching inside secure links section
- Ensure trashed items do not show up in pinned items bar
- Exclude failed items from showing up in excluded monitoring items
- Fix plan upgrade/downgrade dynamic detection
- Fix passkey item detection in PassMonitor
- Fix theme pre-selection during account switch
- Fix pending share access not auto-closing when invalidated

### Version 1.27.2

- Fix app-crash when detecting item shares

### Version 1.27.1

- Remove Offline Mode feature discovery notification
- Hide unsafe URL items from secure links & item view
- Address CSS injection attack vector
- Fix missing item loading state on bulk action

### Version 1.27.0

- Support SSO on desktop
- Fix app unlock UX for SSO users
- Add new in-app notification system
- Fix alias custom domain management displaying incorrect DNS values
- Improve custom domain error messages during verification
- Enforce password generator policy for B2B users

### Version 1.26.1

- Improve app unlock UX for SSO users

### Version 1.26.0

- Add advanced alias management in the settings
- Show alias contacts, stats, display name & SimpleLogin note (if present) for alias item
- Remember item sort order
- Remember window size

### Version 1.25.0

- Add light theme
- Improved dark theme
- Support drag and drop item(s) to another vault/trash
- Add option to automatically clear clipboard
- Add initial onboarding on first login

### Version 1.24.4

- Display multiple exposed values in Pass Monitor
- Adjust copy in spotlight section

### Version 1.24.3

- Fix alias trash acknowledgment for aliases with related logins
- Fix line-break issues on price tags
- Sync missing translations

### Version 1.24.2

- Show confirmation warning when deleting/trashing aliases
- Added new first-install onboarding screen
- Added new post-login welcome flow
- Respect user in-app notification settings

### Version 1.24.1

- Add SSO device verification support
- Improve offline detection on app launch
- Fix onboarding local state not accounting for multi-account
- Fix locked state edge-case blocking user data revalidation

### Version 1.24.0

- Added in-app account switching capabilities
- Improved biometrics locks for account switching support
- UX improvement: Display current user on the unlock screen
- Improved logging for user reports
- Fixed Dashlane import compatibility due to export format changes
- Fixed Kaspersky TXT import compatibility

### Version 1.23.1

- Fine-tune alias syncing
- Allow silent installer & auto-launch

### Version 1.23.0

- Make social security number hidden by default
- Improve UX during authentication failures
- Improve username/email splitting for login items
- Default to most recent vault when creating new items
- Add background SimpleLogin alias syncing

### Version 1.22.3

- Improve importing identities from other password managers
- Fix Pass Monitor missing details section

### Version 1.22.2

- Support for importing identities from other password managers
- Avoid importing duplicate aliases during Proton Pass import

### Version 1.22.1

- Account for extra-password in password labels/placeholders
- Support B2B force lock setting
- Fix initial settings possibly mutated when account switching
- Force logout on un-install sequence

### Version 1.21.2

- Improve OTP donut rendering performance

### Version 1.21.0

- Add support for identity item management
- Fix "Exclude from monitoring" shown on non-login items
- Fix auto-scroll issues in item views

### Version 1.20.2

- Fine-tune secure-link views & actions
- Prevent local session tampering via integrity check
- Improve OTP donut rendering performance
- Improve settings page UI
- Fix local settings re-applied after account switch
- Fix B2B external user invite sequence

### Version 1.20.1

- Improved authentication system
- Revamped cookie management to preserve SessionUID

### Version 1.20.0

- Add support for secure-links
- Add support for email/username split on login items
- Fix stale invites being cached

### Version 1.19.2

- Improved offline detection
- Fine-tune password unlocking
- Fix auth refresh triggered on too many unlock attempts

### Version 1.19.1

- Add extra password support
- Fix missing 2FA warning for B2B organizations

### Version 1.18.0

- Allow locking pass with account password
- Enable password lock by default for all new logins
- Support username & email as separate fields for login items
- Take into account username & email in importers & exporter
- Revamp vault picker UI
- Improve connectivity detection
- Improve generic CSV importer : all fields are now optional
- Support dashlane CSV import

### Version 1.17.5

- macOS and Linux desktop apps public release
- Add keyboard shortcuts ctrl/cmd+f to focus on searchbar and ctrl/cmd+n to create a new item

### Version 1.17.4

- Fix incorrect password health display after importing 1k+ items to a vault
- Show upgrade screen when enabling Sentinel in Pass Monitor

### Version 1.17.3

- Pass Monitor minor improvements & bug fixes (translations, data breach counter)
- Allow users with edit permissions to use "move all items" button

### Version 1.17.2

- Pass Monitor release: check for password health, missing 2FA, and data breaches
- Fix cmd+c & cmd+v not working on macOS desktop app

### Version 1.16.7

- Fix generic CSV template file being empty when downloaded from desktop app
- Improve Proton Pass CSV export/import to support importing items in multiple vaults
- Improve generic CSV import to support importing items in multiple vaults
- Improve initial settings hydration
- Fix favicons loading/flickering

### Version 1.16.1

- Add passkey support
- Fix note items preview in items list
- Improve credit-card items UX for free users

### Version 1.15.0

- Add item history management
- Make bulk item selection only trigger on Ctrl/Cmd + click
- Fix empty vault placeholder buttons click area
- Improve items list placeholder UX

### Version 1.14.1

- Proton Pass desktop app on Windows available to all users

### Version 1.14.0

- Early access version of Proton Pass desktop app on Windows for paid users only

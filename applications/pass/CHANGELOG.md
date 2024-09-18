### Version 1.23.0

-   Make social security number hidden by default
-   Improve UX during authentication failures
-   Improve username/email splitting for login items
-   Default to most recent vault when creating new items

### Version 1.22.3

-   Improve importing identities from other password managers
-   Fix Pass Monitor missing details section

### Version 1.22.2

-   Support for importing identities from other password managers
-   Avoid importing duplicate aliases during Proton Pass import

### Version 1.22.1

-   Account for extra-password in password labels/placeholders
-   Support B2B force lock setting
-   Fix initial settings possibly mutated when account switching

### Version 1.21.2

-   Improve OTP donut rendering performance

### Version 1.21.0

-   Add support for identity item management
-   Fix "Exclude from monitoring" shown on non-login items
-   Fix auto-scroll issues in item views

### Version 1.20.2

-   Fine-tune secure-link views & actions
-   Prevent local session tampering via integrity check
-   Improve OTP donut rendering performance
-   Improve settings page UI
-   Fix local settings re-applied after account switch
-   Fix B2B external user invite sequence

### Version 1.20.1

-   Improved authentication system

### Version 1.20.0

-   Add support for secure-links
-   Add support for email/username split on login items
-   Fix stale invites being cached
-   Improve app version update detection
-   Improve app service worker

### Version 1.19.2

-   Improved offline detection
-   Fine-tune password unlocking
-   Fix auth refresh triggered on too many unlock attempts

### Version 1.19.0

-   Add extra password support
-   Improve web-app deep linking for B2B organizations
-   Fix missing 2FA warning for B2B organizations

### Version 1.18.0

-   Add offline mode support on web app
-   Allow locking pass with account password
-   Enable password lock by default for all new logins
-   Support username & email as separate fields for login items
-   Take into account username & email in importers & exporter
-   Revamp vault picker UI
-   Improve connectivity detection
-   Improve generic CSV importer : all fields are now optional
-   Support dashlane CSV import

### Version 1.17.5

-   macOS and Linux desktop apps public release

### Version 1.17.4

-   Fix incorrect password health display after importing 1k+ items to a vault
-   Show upgrade screen when enabling Sentinel in Pass Monitor

### Version 1.17.3

-   Pass Monitor minor improvements & bug fixes (translations, data breach counter)
-   Allow users with edit permissions to use "move all items" button

### Version 1.17.2

-   Pass Monitor release: check for password health, missing 2FA, and data breaches

### Version 1.16.5

-   Improve Proton Pass CSV export/import to support importing items in multiple vaults
-   Improve generic CSV import to support importing items in multiple vaults
-   Improve initial settings hydration
-   Fix favicons loading/flickering

### Version 1.16.0

-   Add passkey support
-   Fix note items preview in items list
-   Improve credit-card items UX for free users

### Version 1.15.0

-   Add item history management
-   Make bulk item selection only trigger on Ctrl/Cmd + click
-   Fix empty vault placeholder buttons click area
-   Improve items list placeholder UX

### Version 1.14.1

-   Improve service-worker registration phase
-   Auto-scroll when expanding sub menus
-   Improve cross-tab syncing and caching
-   Fix bulk item edition keyboard shortcut being triggered when text was selected
-   Fix bulk selection conflicts with opened modals
-   Fix TOTP counter flickering on exotic zoom levels
-   Fix edge-case race condition when refreshing tokens
-   Fix text alignments on item counters
-   Fix caching issues with regards to session locking

### Version 1.13.2

-   Patch content format version v2 on stale cached items
-   Fix share crypto snapshot being cleared on user event
-   Improve cache hydration sanitization step

### Version 1.13.1

-   Improve file format validation in importer
-   Improve app logs access and retention
-   Automatically clear PIN input field when invalid
-   Allow exporting Pass data to CSV
-   Exclude non-owned vaults from exported data
-   Increase password history retention time to 2 weeks
-   Fine-tune B2B specific UI

### Version 1.13.0

-   Support bulk invitations
-   Support invite email suggestions
-   B2B support with custom onboarding
-   Allow searching items by alias email
-   Fix import button not disabled when file removed
-   Improve user access/features polling

### Version 1.12.0

-   Add bulk item actions from items list
-   Support language switching
-   Improve API request concurrency
-   Fix generic import CSV content
-   Fix Enpass import when both username/email in login item

### Version 1.11.1

-   Add keyboard shortcut Ctrl/Cmd + S to save a new or existing item
-   Take into account custom text fields when searching
-   Support importing a generic CSV file with template provided
-   Support importing collections in Bitwarden imports
-   Increase default password length to 20 characters
-   Fix alias prefix derivation

### Version 1.11.0

-   Add account link in settings

### Version 1.10.1

-   Improve cross tab synchronization
-   Fix crash on non-latin character search queries
-   Fix inactive/locked session detection during boot sequence
-   Fix enpass import edge-case where fields are undefined
-   Fix account automatic session forking from path

### Version 1.10.0

-   Web app available to all users
-   Enable item pinning (behind feature flag)
-   Remove spaces when copying card number
-   Display YY instead of YYYY for card expiration year
-   Support totpUri with only secret without scheme
-   Reset selected share filter when leaving vault
-   Trim vault name in search bar
-   Add item ID and vault ID in more info panel
-   Fine-tune alias title validation

### Version 1.9.6

-   Refactor OTP parsing utilities
-   Fix OTP sanitization & parsing edge-case on incomplete URIs
-   Enable importing and exporting from web-app
-   Add confirm password step before export
-   Fix extra-field not resizing on visibility change

### Version 1.9.5

-   Fix redirection errors on item delete/restore from trash view

### Version 1.9.4

-   Restrict free trial users from early-access
-   Fix external links

### Version 1.9.3

-   First working version of Pass web-app
-   Early access to paid users only

### TODO put correct version Version 1.10.0

-   Bulk actions on items (move, delete, permanantly delete, restore)

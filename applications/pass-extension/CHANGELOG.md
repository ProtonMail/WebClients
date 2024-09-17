### Version 1.23.0

-   Add support for remote autofill ignore list
-   Allow autofilling identity emails
-   Make social security number hidden by default
-   Improve UX during authentication failures
-   Improve username/email splitting for login items
-   Default to most recent vault when creating new items
-   Remove autosave vault in favor of most recent vault
-   Improve extension bundle size
-   Fix conflict with AttentiveSMS third-party library

### Version 1.22.4 [Safari]

-   Fixed logout issues due to service-worker registration failures

### Version 1.22.3

-   Improve importing identities from other password managers
-   Fix Pass Monitor missing details section

### Version 1.22.2

-   Support for importing identities from other password managers
-   Avoid importing duplicate aliases during Proton Pass import

### Version 1.22.1

-   Decouple "inject" from "open-on-focus" autofill setting
-   Account for extra-password in password labels/placeholders
-   Support B2B force lock setting
-   Fix initial settings possibly mutated when account switching

### Version 1.21.2

-   Add identity autofill support
-   Allow disabling identity autofill from settings view
-   Retrain detectors for all form & field types
-   Improve OTP item matching with priority given to direct subdomain matches
-   Improve OTP donut rendering performance
-   Fix input field bounding box resolution edge-cases
-   Fine-tune injected icon overlaying elements detection
-   Improve detection triggers & visibility checks in content-script
-   Fix custom-element root removal not resetting injected applications
-   Fix injected icon positioning problems with regards to browser zoom level
-   Safari extension: add account removal link in host app

### Version 1.21.1

-   Patch OTP field detectors

### Version 1.21.0

-   Add support for identity item management
-   Allow matching OTP extra-fields during autofill
-   Fix "Exclude from monitoring" shown on non-login items
-   Fix auto-scroll issues in item views

### Version 1.20.2

-   Disable passkeys feature discovery when no items are matched
-   Fine-tune secure-link views & actions
-   Prevent local session tampering via integrity check
-   Improve OTP donut rendering performance
-   Improve settings page UI
-   Fix local settings re-applied after account switch
-   Fix B2B external user invite sequence
-   Fix webauthn timeout errors

### Version 1.20.0

-   Add support for secure-links
-   Add support for email/username split on login items
-   Fix stale invites being cached

### Version 1.19.2

-   Fine-tune password unlocking
-   Fix auth refresh triggered on too many unlock attempts

### Version 1.19.0

-   Add extra password support
-   Add support for safari extension
-   Disable production source maps to lighten extension size
-   Fix missing 2FA warning for B2B organizations

### Version 1.18.0

-   Support username & email as separate fields for login items
-   Take into account username & email in importers & exporter
-   Revamp vault picker UI
-   Improve generic CSV importer : all fields are now optional
-   Support dashlane CSV import
-   Fix 2FA autofill edge-cases

### Version 1.17.5

-   Safari browser extension release

### Version 1.17.4

-   Don't show read-only passkeys in autosave modal
-   Handle empty public key params in passkey creation request
-   Fix incorrect password health display after importing 1k+ items to a vault
-   Show upgrade screen when enabling Sentinel in Pass Monitor

### Version 1.17.3

-   Pass Monitor minor improvements & bug fixes (translations, data breach counter)
-   Allow users with edit permissions to use "move all items" button

### Version 1.17.2

-   Pass Monitor release: check for password health, missing 2FA, and data breaches

### Version 1.16.7

-   Fix autosave regression due to early reconciliation
-   Fix alias autofill not closing injected dropdown
-   Fix register autosave duplicates

### Version 1.16.6

-   Rollback to 1.16.4

### Version 1.16.5

-   Improve Proton Pass CSV export/import to support importing items in multiple vaults
-   Improve generic CSV import to support importing items in multiple vaults
-   Improve initial settings hydration
-   Allow disabling passkeys in the settings (globally or per website)
-   Improve autosave for password change forms & password autosuggest
-   Add setting to allow prompting autosave right after generating a password
-   Allow selecting in autosave which item to update between multiple items after updating a login
-   Fix favicons loading/flickering
-   Fix security-key conflicts with passkey integration
-   Fix 2FA autofill popup reopening after closing it in certain websites

### Version 1.16.4

-   Fix settings persistence shadowed by locale sync
-   Fine-tune extension menu items alignment

### Version 1.16.3

-   Detect if navigator credentials API is available before intercepting
-   Reduce webauthn content-script size
-   Improve autofill edge-cases (ie: idmobile.co.uk)
-   Fine-tune form/field detection triggers
-   Fix stalling injected dropdown on SPA multi-step forms
-   Fix corejs conflicts in webauthn content-script
-   Fix stale injected iframe state due to deferred locale change

### Version 1.16.2

-   Fix injected notification overlay indexing (fixes coinbase passkey setup)
-   Fix inline style CSP policies for firefox shadow elements (fixes bitwarden & mastodon)

### Version 1.16.1

-   Fix injection bottlenecks on docusign.com

### Version 1.16.0

-   Add passkey support
-   Fix custom-elements disruptions in firefox content-scripts
-   Fix note items preview in items list
-   Improve credit-card items UX for free users

### Version 1.15.0

-   Improve performance of autofill/autosuggest/autosave prompts
-   Fix injected custom elements registration phase breaking certain websites
-   Add item history management
-   Make bulk item selection only trigger on Ctrl/Cmd + click
-   Fix empty vault placeholder buttons click area
-   Improve items list placeholder UX

### Version 1.14.1

-   Preserve session when opening web-app from extension when possible
-   Improve event polling triggers to apply back-pressure
-   Auto-scroll when expanding sub menus
-   Fix autofill suggestions ordering with regards to last used time
-   Fix bulk item edition keyboard shortcut being triggered when text was selected
-   Fix bulk selection conflicts with opened modals
-   Fix TOTP counter flickering on exotic zoom levels
-   Fix settings not being persisted in certain edge-cases
-   Fix edge-case race condition when refreshing tokens
-   Fix text alignments on item counters

### Version 1.13.2

-   Patch content format version v2 on stale cached items
-   Fix domain images not loading
-   Fix share crypto snapshot being cleared on user event
-   Improve cache hydration sanitization step

### Version 1.13.1

-   Improve file format validation in importer
-   Improve app logs access and retention
-   Improve field autofill strategies
-   Automatically clear PIN input field when invalid
-   Allow exporting Pass data to CSV
-   Exclude non-owned vaults from exported data
-   Increase password history retention time to 2 weeks

### Version 1.13.0

-   Support bulk invitations
-   Support invite email suggestions
-   Improve and fix autosave triggers
-   Allow searching items by alias email
-   Fix import button not disabled when file removed
-   Improve user access/features polling

### Version 1.12.0

-   Add bulk item actions from items list
-   Improve API request concurrency
-   Fix generic import CSV content
-   Fix Enpass import when both username/email in login item

### Version 1.11.1

-   Add keyboard shortcut Ctrl/Cmd + S to save a new or existing item
-   Take into account custom text fields when searching
-   Support importing a generic CSV file with template provided
-   Support importing collections in Bitwarden imports
-   Increase default password length to 20 characters
-   Fix "file too big" error during import
-   Fix alias prefix derivation

### Version 1.11.0

-   Allow customizing the password generated in a website
-   Add quick link to onboarding tutorial in extension menu
-   Small improvements for icon injection positioning edge-cases (more coming next week)
-   Add account section in extension menu
-   Add account link in settings

### Version 1.10.1

-   Preserve cached data on extension updates
-   Fix crash on non-latin character search queries
-   Fix inactive/locked session detection during boot sequence
-   Fix enpass import edge-case where fields are undefined
-   Fix random logouts due to browser alarms triggered on idle service-worker

### Version 1.10.0

-   Enable item pinning (behind feature flag)
-   Remove spaces when copying card number
-   Display YY instead of YYYY for card expiration year
-   Migrate extension to common pass routing architecture
-   Support totpUri with only secret without scheme
-   Reset selected share filter when leaving vault
-   Trim vault name in search bar
-   Add item ID and vault ID in more info panel
-   Fine-tune alias title validation
-   Clear all alarms on browser start-up
-   Fix race condition when boot sequence surpasses lock TTL
-   Fix duplicate lock check during export sequence

### Version 1.9.6

-   Refactor force lock on browser startup sequence
-   Improve auto-resume sequence via browser alarms
-   Improve unlock view loading state UI
-   Increase number of session resume retries with backpressure
-   Handle session resume errors in injected dropdown
-   Add confirm password step before export
-   Fix enpass import file validation
-   Fix OTP sanitization & parsing edge-case on incomplete URIs
-   Fix extra-field not resizing on visibility change
-   Improve error handling of extension APIs

### Version 1.9.5

-   Fix popup window not autoclosing on firefox
-   Add early access link to web-app from menu

### Version 1.9.4

-   Hotfix domain image proxy url in extension
-   Clear API Proxy cache on extension Update

### Version 1.9.3

-   Handle unlock anomaly on session lock is removed (webapp/extension sync)
-   Support payloads larger than 65kB when obfuscating (eg. notes)
-   Support abort signals for domain image loading

### Version 1.9.2

-   Ensure runtime reloads do not get flagged as suspicious
-   Exclude pass domains from content-script injections
-   Fine-tune activity probing for automatic lock extension
-   Auto-resume on popup-initiated wakeup calls if worker is errored
-   Show rating prompt in real time after item creation
-   Fix unnecessary lock sequence if session already locked
-   Fix login autofill unable to scroll to bottom
-   Fix imports from Bitwarden for Organisations

### Version 1.9.1

-   Support importing Bitwarden folders to separate vaults
-   Hotfix for failing autofill

### Version 1.9.0

-   Allow moving all vault items to another vault
-   Improved autofill & autosave: SPA support, domain/subdomain matching
-   Account for protocol when autosaving
-   Prevent injection on non-HTML documents, for example XML files
-   Short-circuit favicon fetch on reserved domains
-   Set minimum compatible Chrome version
-   Force lock on browser restart
-   Allow adding webpages to pauselist from injected notification or dropdown
-   Support parsing legacy OTP URLs containing spaces in the secret
-   Automatically discard drafts when items are deleted or share disabled
-   Garbage collect password history on app boot
-   Prevent exporting if session invalid or locked
-   Authentication service refactor
-   Fix import button disabled when max vaults reached
-   Fix credit card expiration dates for Dashlane imports
-   Fix hamburger icon when in trash
-   Fix LastPass CRCRLF case
-   Fix event polling continuing after invalid/locked session
-   Fix Dashlane importer when no credit card in CSV
-   Fix shared alias mailbox value when mailbox cannot be managed
-   Fix long passwords line break

### Version 1.8.4

-   Support Roboform imports
-   Support NordPass imports
-   Support Enpass imports
-   Fix Keepass XML file trimming
-   Setup black friday spotlight messages
-   Fine-tune empty vault screen
-   Fix pass icon injection breaking `display: grid`
-   Increase relative injected dropdown z-index position
-   Fine-tune transition/animation edge-cases in injected styles
-   Autosuggest password based on user preferences
-   Fix importing into multiple new vaults

### Version 1.8.3

-   Fix firefox sources generation script

### Version 1.8.2

-   Safeguard against version mismatches between the worker and components during extension updates
-   Automatically switch to the created vault upon success
-   Support inviting external & unverified users
-   Fix the "open in new window" functionality on Firefox
-   Support sharing directly from the item view
-   Display a notification in the vault list if a new user invite can be confirmed
-   Correct the text color for disabled fields
-   Resolve bug related to oldest vault deletion
-   Enhance loading states when responding to an invite (progress bar)
-   Fix quick actions for empty vaults
-   Handle shared vault limits appropriately
-   Eliminate legacy access requests during authentication
-   Fine-tune cache rehydration process during boot sequence
-   Improve state updates during event polling (detect noops and support invite polling)
-   Refine vault and item actions based on permissions and shared flag
-   Add a custom onboarding sequence for pending vault access for unverified users
-   Update the endpoint for resolving user public address keys
-   Fix PIN for credit card imports from 1password 1pif/1pux files

### Version 1.8.1

-   Removed primary vault usage, replaced by autosave vault with backwards compatibility
-   Added support for localization via settings
-   Improved word matching in items query with more accurate search results
-   Enabled expanding popup to a new window
-   Fine-tuned item actions based on current user permissions
-   Improved settings UI

### Version 1.8.0

-   Sharing functionality enabled for both internal and external users
-   Update copy for enhanced clarity
-   Fine-tune dropdown menu
-   Improve long vault name display to ensure readability
-   Enhanced request invalidation via max age/acknowledgement
-   Fix vault deletion confirmation modal close issue ensuring proper state reset.
-   Validate popup tab state on initialization to prevent potential issues.
-   Deduplicate notifications on alias request errors

## Version 1.7.1

-   Hotfix: add cache versioning in order to alleviate update sequence cache resets
-   Show selected vault icon & email address in hamburger menu

## Version 1.7.0

-   Setup alarm based session locking
-   Obfuscate sensitive fields in in-memory store
-   Fix settings wiped on extension update

## Version 1.6.2

-   Force runtime reload on manual user lock or detected API lock

## Version 1.6.1

-   Fix browser alarm creation in request tracker
-   Clean-up alarms on extension update
-   Improve vivaldi browser support (fix badge & sizing issues)

## Version 1.6.0

-   Factorize content-script feature resolution
-   Improve pause-list domain matching
-   Fine-tune icon positioning upon overlay detection
-   Copy generated password from autosuggest dropdown to clipboard
-   Garbage collect stale tracked requests in XMLHttpRequestTracker
-   Prevent hard references to WebRequest in XMLHttpRequestTracker (potential memory leak)
-   Enhance cache-proxy for domain image caching
-   Gracefully handle extension storage errors
-   Ensure page is loaded or in complete state before registering client
-   Optimize icon repositioning triggers and injected frame visibility toggles
-   Refactor autofill data synchronization
-   Fix multiple iframe initializations triggered during content-script init
-   Fix and refactor injected dropdown resizing behavior
-   Remove zoom-factor hack for popup zoom surgery
-   Fi inconsistencies in pop-ups and injections when users change the browser's default font-size settings
-   Fix reported copy errors
-   Improve DOM node flagging and optimize prepass in detectors + retrain
-   Resolve trickest.io breakage caused by custom-elements registration conflict
-   Correct detectors' false positives on WYSIWYG editors

## Version 1.5.3

-   Fix disallowed domains not being cleaned-up in persisted settings when deleting an entry

## Version 1.5.2

-   Resolved autofill inconsistency in domain matching for partial string matches.
-   Fixed Firefox injection inconsistencies caused by restrictive CSP policies blocking inline styles.
-   Addressed z-index positioning issues affecting injected dropdowns.
-   Enhanced search placeholder user experience and made minor copy corrections.
-   Corrected password preview to reveal spaces and display the complete password.
-   Fixed 1pux importer error with empty credit card fields.
-   Resolved PIN unlock issue from injected dropdown, which got stuck after an incorrect PIN.
-   Fixed popup state persistence on Firefox, including draft support.

## Version 1.5.1

-   Hotfix event polling timeout when extension is inactive
-   Update user rating spotlight design

## Version 1.5.0

-   Removed extension's control over browser password settings
-   Fixed overlay detection heuristic for placeholders/labels
-   Adapted event polling timeout based on extension activity
-   Improved extension crash UI
-   Simplified and improved icon injection (enhanced support for content-box layouts)
-   Automatically extended session lock when extension is active via probing
-   Utilized new feature flags endpoint
-   Added new user rating spotlight message and adjusted triggers
-   Moved injections to custom elements and shadow DOM to minimize CSS conflicts
-   Fixed: Prevented field focus on injected icon click
-   Improved content-script destroy and recycling

## Version 1.4.2

-   Fix inconsistent personal vault icon
-   Fix for downgrade message showing on autofill for PLUS users
-   Add strict origin check for all messages coming from extension controlled pages
-   Moved autofill credential resolution to extension controlled frame

## Version 1.4.1

-   Fix OTP autofill glitch on Firefox blocking autofill via clipboard strategy
-   Improve alias error messages

## Version 1.4.0

-   2FA/OTP Autofill support : Now you can autofill two-factor authentication one-time passwords
-   Updated & retrained form & field detectors : reduce bottlenecks, improved caching
-   Improved pass icon injection positioning (better animated form support + fix user reported issues)
-   Fixed CSS injection & DOM conflicts
-   Reorganised popup menu: quick link to view password history, updated download & feedback links.
-   Fix note view glitches on "long single phrase" notes
-   Enhanced note content selection : select item note content without triggering click-to-copy.
-   Support Credit-Cards when importing from Bitwarden, LastPass & 1Password
-   Always prefer importing to primary vault
-   Improved import UI/UX : Better error reporting and vault limit warnings
-   Allow unlocking Pass from the injected dropdown in a website
-   Fixed edge-case scenario where sessions would not persist when locked on initial login.

## Version 1.3.1

-   Hotfix injection settings not taken into account
-   Improve session forking edge-cases
-   Improve password history UX

## Version 1.3.0

-   Credit card item support
-   Add skip button during the onboarding
-   Improved the hamburger menu
-   Changed item highlight to be more readable
-   Show sorting indicator
-   Improved dashlane importer
-   Search takes into account login notes
-   Improve injection positioning
-   Remove core styles from injected css

## Version 1.2.5

-   Firefox add strict minimum supported version (>109)
-   Increase item request batch size (affects importers, item moves & restores)
-   Disable event-polling during import sequence

## Version 1.2.4

-   Patch extension installation detection on account.proton.me on firefox

## Version 1.2.3

-   Lazy load alias options on login edit/new views
-   Hotfix alias options error on unverified accounts

## Version 1.2.2

-   Hotfix user email loading glitch in injected dropdown

## Version 1.2.1

-   Hotfix user email resolution in injected dropdown
-   Support importing Keepass custom fields
-   Fix & monitor detection bottleneck
-   Autosave notification revamp

## Version 1.2.0

-   Improved extension onboarding
-   Draft mode for edits and item creation
-   Popup sorting filters persistence
-   Password generation options persistence
-   Persist popup state on a per tab basis (preserves selected item)
-   Optimize search performances in pop-up
-   Support importing from Keeper
-   Import 1password extra fields
-   Import bitwarden extra fields
-   New importer UI from settings page
-   Allow autofilling current proton address from email autosuggest
-   Improve icon injection & repositioning on page fields
-   Update detection models re-trained on user reported issues
-   Improved support for attribute changes in detected fields (ie: password show/hide)
-   Fix user-reported animation conflicts in injected elements
-   Cache form/field detection results for improved performances
-   Improve detection triggers to reduce ProtonPass footprint
-   Detect detection bottlenecks and kill content-script accordingly
-   Injected Autofill/Autosuggest dropdown re-design
-   New ProtonPass icons in browser toolbar reflecting user session state
-   Improve search bar UX in pop-up
-   Fix primary vault errors on initial boot sequence
-   Fix password generation character color glitches

## Version 1.1.2

-   Fix regex backtracking issues in form detectors

## Version 1.1.1

-   Fix detection triggers causing slowdowns (Wordpress live editor & Thrive architect plugin)
-   Fix unnecessary injections on proton.me forms
-   Fix injected icon messing with page tabIndex
-   Fix random password generation character list
-   Sync form/field detectors with user reported detection errors
-   Improve outlier detection for MFA & OTP fields (autofill coming soon)
-   Improve outlier detection of username fields
-   Support autosuggest|autofill on dangling password fields
-   Fix KeePass XML import errors
-   Memorable password option in popup password generator

## Version 1.1.0

-   Fix zoom-level issues on chrome when user has custom browser settings
-   Enable feature flags
-   Fix firefox account communication issues on login
-   Fix user pin-lock triggers
-   Improved injected iframe security (secure iframe port injection)
-   Content-script rewrite
-   Improved field icon injection (overlay detection, positioning errors)
-   New & improved detectors added to the content-script
-   Optimise form detection triggers
-   Add support for dynamic fields, SPA forms, animated forms in content-script
-   Import from Dashlane
-   Import from Firefox
-   Import from Safari
-   Improve 1Password import (support 1pif format)
-   Improve LastPass importer
-   Improve importer recap in settings page
-   Disable default PGP encryption when exporting from Pass
-   Support trial mode
-   Implement user plan limits
-   Custom fields support behind feature flag
-   Implement public suffix list domain checks in autofill candidate resolution
-   Add protocol checks when resolving autofill candidates
-   New onboarding welcome page after login
-   New vault deletion confirmation modal for safety
-   Improved note field UI in custom fields

### TODO put correct version Version 1.10.0

-   Bulk actions on items (move, delete, permanantly delete, restore)

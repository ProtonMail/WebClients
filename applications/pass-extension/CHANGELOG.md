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

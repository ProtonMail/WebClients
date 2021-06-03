# [3.16.64] - 2021-06-03

## Fixes
- Various UI/UX improvements Fixes

# [3.16.63] - 2021-05-27

## Fixes
- Fix issue on Safari 13.1

# [3.16.62] - 2021-05-27

## Updates

- Remove beta link on login page
- Update footer copy on login page
- Update encrypted outside pages to match with v4 design
- Remove version number present in user dropdown when a new version is available
- Update abuse modal copy

## Fixes

- Fix missing plural forms 

# [3.16.61] - 2021-04-09

- Add available domains params on login page

# [3.16.60] - 2021-03-12

## Fixes

-   Fix url support on older versions of chrome

# [3.16.59] - 2021-03-08

## Improvements

-   Various UI/UX improvements Fixes

# [3.16.58] - 2021-02-09

## Improvements

-   Improve signup loading time

# [3.16.57] - 2021-02-04

## Fixes

-   Various UI/UX improvements Fixes

# [3.16.56] - 2021-02-03

## Fixes

- Fix incorrect message decryption in certain cases

# [3.16.55] - 2021-02-01

## Improvements

-   Various UI/UX improvements Fixes

# [3.16.54] - 2021-01-31

## Fixes

- Improve error notification handling

# [3.16.53] - 2021-01-20

## Updates

- Increase base timeout for signup iframe challenge

## Fixes

- Fix addresses typo
- List all `ClientID` for sessions section

# [3.16.52] - 2021-01-13

## Improvements

-   Add retry mechanism when inputs are not loading properly on signup page

# [3.16.51] - 2021-01-05

## Updates

-   Sign attachments with the primary key to support new API changes

# [3.16.50] - 2020-12-29

## Fixes

-   Delete account process was not working properly for paid account

# [3.16.49] - 2020-12-28

## Fixes

-   Refresh name and password for VPN after reset

# [3.16.48] - 2020-12-28

## Updates

-   Includes Safari 14.0.2 version to broken upload
-   Reset VPN user/name instead of manual edition

# [3.16.47] - 2020-12-15

## Improvements

-   Show tooltip for broken Safari
-   Make Feature API call silent
-   Add missing plural form

## Fixes

-   `hasBonuses` has to check `LoyaltyCounter` not just `Flags`

## Updates

-   Add forbidden login auth event
-   Remove end limit for product payer promotion
-   Turn autocomplete off for username input
-   Try to apply BF2020 coupon code each time the user update subscription configuration

# [3.16.46] - 2020-11-25

## Improvements

-   Add red dot for BF navigation icon
-   Remove cookie support for remembering displayed modals
-   Update whitelist / blacklist to Allow List/Block List

# [3.16.45] - 2020-11-19

## Fixes

-   Next promotion was sometimes not properly calculated.
-   Promotion state was not reset after logout.

# [3.16.44] - 2020-11-17

## Improvements

-   Reduce number of time we are checking promotion logic period.

# [3.16.43] - 2020-11-16

## Improvements

-   Keep promotion modal state with API instead of using local storage.

# [3.16.42] - 2020-11-16

## Improvements

-   Various UI/UX improvements Fixes

# [3.16.41] - 2020-11-13

## Improvements

-   Various UI/UX improvements Fixes

# [3.16.40] - 2020-11-09

## Improvements

-   Various UI/UX improvements Fixes

# [3.16.39] - 2020-11-04

## Improvements

-   Various UI/UX improvements Fixes

# [3.16.38] - 2020-11-04

## Improvements

-   Various UI/UX improvements Fixes

# [3.16.37] - 2020-10-28

## Improvements

-   Various UI/UX improvements Fixes

## Fixes

-   Various bug fixes

# [3.16.36] - 2020-10-28

## Improvements

-   Various UI/UX improvements Fixes

## Fixes

-   Various bug fixes

# [3.16.35] - 2020-10-28

## Improvements

-   Various UI/UX improvements Fixes

## Fixes

-   Various bug fixes

# [3.16.34] - 2020-10-05

## Fixes

-   In some cases, the application failed to load the username input field on the account creation page.

## Improvements

-   Better error handling on account creation page
-   Increased VPN add-on limit to 1000 connections

# [3.16.33] - 2020-08-03

## Updates

-   Added a warning state for DKIM state to avoid confusion with the error state

# [3.16.32] - 2020-07-31

## Fixed

-   Fixed an issue whereby users could not unsubscribe from forwarded message if the address is not found (catch-all)
-   Fixed outstanding bugs that may get users to receive an "invalid access token" upon logging out

# [3.16.31] - 2020-07-27

## Updates

-   User deletion improvements

# [3.16.30] - 2020-07-14

## Updates

-   DKIM guide improvements

## Fixed

-   Improve paypal verification flow

# [3.16.29] - 2020-06-27

## Fixed

-   Fix contact keys showing as inactive

# [3.16.28] - 2020-06-27

## Fixed

-   Fix decryption error for certain users on login

# [3.16.27] - 2020-06-23

## Fixed

-   Display verification error when attempting to verify account with existing email or username
-   Race condition when changing password
-   Handle non-existing sender
-   Member key list signature verification for key activation

# [3.16.26] - 2020-06-17

## Fixed

-   "Invalid access token" error appearing under some specific conditions
-   Wrong Android app link in the welcome modal

## Updates

-   DKIM automatic key rotation

# [3.16.25] - 2020-05-30

## Fixed

-   Bug with the scrollbar located in the sidebar

# [3.16.24] - 2020-05-29

## Fixed

-   Bug when using the address option in advanced search
-   Bug when activating a ProtonMail mailbox in some cases
-   Bug when user is signed out upon receiving an internal server error
-   Various bugs related to processing notifications and unread counters

## Updates

-   reCAPTCHA verification - adding privacy and terms links
-   Open PGP 4.10 - adding polyfill for atob
-   Payments - improving token processing
-   Encryption - upgrading keys

# [3.16.23] - 2020-04-09

## Fixed

-   SMS and Email verification bugs during sign up
-   Translations bugs
-   Disable address bug

## Updated

-   COVID-19 campaign bonus added

# [3.16.22] - 2020-03-10

## Updated

-   New OpenPGP version

# [3.16.21] - 2020-02-17

## Fixed

-   Add support for DKIM rotation

# [3.16.20] - 2020-01-09

## Fixed

-   On rare occasions an older draft was sent instead of the current one
-   Some users were randomly logged out if the tab was kept open for a long time
-   Some mail-to links did not properly work on Safari

## Updated

-   New OpenPGP version

# [3.16.19] - 2019-12-17

## Fixed

-   Upgrade button was not properly displayed for free accounts

# [3.16.18] - 2019-12-12

## Fixed

-   Two year plan was not shown as an option in some cases
-   PayPal payment method was not always saved on sign-up

# [3.16.17] - 2019-12-03

## Fixed

-   extending some customized plans displayed an error that upgrade is not possible

# [3.16.16] - 2019-12-03

## Fixed

-   organization admins were not able to log into non-private user accounts

# [3.16.15] - 2019-12-02

## Changed

-   Updated promotional modal for Plus users

# [3.16.14] - 2019-11-29

## Fixed

-   The compose button was not usable for some users

# [3.16.13] - 2019-11-28

## Improved

-   Payment and promotion modals

# [3.16.12] - 2019-11-26

## Fixed

-   prices on some promotion modals were shown incorrectly

# [3.16.11] - 2019-11-25

## Fixed

-   Black Friday link condition

# [3.16.10] - 2019-11-25

## Added

-   warning for browsers that do not support payment confirmations in a new tab

## Changed

-   Payment improvements

# [3.16.9] - 2019-11-20

-   Fixed an issue that caused Safari to show inconsistent dates in some cases

# [3.16.8] - 2019-11-18

-   WKD support for contacts
-   Added loyalty benefits modal when unsubscribing

# [3.16.7] - 2019-11-14

-   Signup improvements
-   Added back Portuguese and Calataln translations
-   Uupdated translations
-   Fixed a typo in the 2FA modal

# [3.16.6] - 2019-10-01

## Fixed

-   Authentication logs show both log out and login in the same row for 2FA logs
-   Add support for PayPal credit
-   Fix show CC/BCC with plain-text mode
-   Fix chinese issue in composer

# [3.16.5] - 2019-10-01

## Fixed

-   Both log out and login in events were shown in the authentication logs for some users
-   Payment methods are now refreshed after top up or donation
-   Improvements for 3-D secure payment verification
-   Improvements for some login scenarios
-   Improvements to the translations

## Changed

-   Updated pmcrypto library

# [3.16.4] - 2019-09-11

## Added

-   Support for payments with 3DS enabled credit cards

## Fixed

-   Attachments were not shown when printing a message
-   Decryption error was shown for certain messages
-   Some error messages were not properly displayed

## Changed

-   PayPal payments improvements

# [3.16.3] - 2019-07-29

## Changed

-   Sending limits handling
-   Removed drag and drop in contacts list

# [3.16.2] - 2019-07-08

## Fixed

-   Cannot import `.csv` files to contact list.

# [3.16.1] - 2019-07-03

## Fixed

-   Auto-reply calendar showed wrong day name in some languages
-   Contact group didn't appear in auto-suggestion dropdown once removed
-   Some links failed to open when `request link confirmation` option was enabled
-   After downloading image attachment it was possible to get logged out
-   Some characters did not get properly exported in vCard
-   Some 'Mailto' links did not populate the subject line
-   Using the star option on a lot of messages could make the browser unresponsive
-   Embedded image wasn't removed when deleted from attachment list

# [3.16.0] - 2019-06-06

[![ProtonMail v3.16 has been released!](assets/img/v3-16.jpg)](https://protonmail.com/blog/protonmail-v3-16-release-notes/)

[ProtonMail 3.16](https://protonmail.com/blog/protonmail-v3-16-release-notes/)

## Added

-   Prevent homograph Attack while redirecting links (Punycode)

## Fixed

-   Sanitization error was shown for some messages
-   Credits added via Bitcoin could not be used immediately
-   Adding more that one VPN connection to a user resulted in only one connection being applied

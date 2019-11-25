# [3.16.10] - 2019-11-25
## Added
- warning for browsers that do not support payment confirmations in a new tab

## Changed
- Payment improvements

# [3.16.9] - 2019-11-20

- Fixed an issue that caused Safari to show inconsistent dates in some cases

# [3.16.8] - 2019-11-18

- WKD support for contacts
- Added loyalty benefits modal when unsubscribing

# [3.16.7] - 2019-11-14

- Signup improvements
- Added back Portuguese and Calataln translations
- Uupdated translations
- Fixed a typo in the 2FA modal

# [3.16.6] - 2019-10-01
## Fixed
- Authentication logs show both log out and login in the same row for 2FA logs
- Add support for PayPal credit
- Fix show CC/BCC with plain-text mode
- Fix chinese issue in composer

# [3.16.5] - 2019-10-01

## Fixed

- Both log out and login in events were shown in the authentication logs for some users
- Payment methods are now refreshed after top up or donation
- Improvements for 3-D secure payment verification
- Improvements for some login scenarios
- Improvements to the translations

## Changed

- Updated pmcrypto library

# [3.16.4] - 2019-09-11
## Added
- Support for payments with 3DS enabled credit cards

## Fixed
- Attachments were not shown when printing a message
- Decryption error was shown for certain messages
- Some error messages were not properly displayed

## Changed
- PayPal payments improvements

# [3.16.3] - 2019-07-29
## Changed
- Sending limits handling
- Removed drag and drop in contacts list

# [3.16.2] - 2019-07-08
## Fixed
- Cannot import `.csv` files to contact list.

# [3.16.1] - 2019-07-03
## Fixed
- Auto-reply calendar showed wrong day name in some languages
- Contact group didn't appear in auto-suggestion dropdown once removed
- Some links failed to open when `request link confirmation` option was enabled
- After downloading image attachment it was possible to get logged out
- Some characters did not get properly exported in vCard
- Some 'Mailto' links did not populate the subject line
- Using the star option on a lot of messages could make the browser unresponsive
- Embedded image wasn't removed when deleted from attachment list

# [3.16.0] - 2019-06-06

[![ProtonMail v3.16 has been released!](assets/img/v3-16.jpg)](https://protonmail.com/blog/protonmail-v3-16-release-notes/)

[ProtonMail 3.16](https://protonmail.com/blog/protonmail-v3-16-release-notes/)

## Added
- Prevent homograph Attack while redirecting links (Punycode)

## Fixed
- Sanitization error was shown for some messages
- Credits added via Bitcoin could not be used immediately
- Adding more that one VPN connection to a user resulted in only one connection being applied

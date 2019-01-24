# [3.15.15] - 2019-01-24

## Fixed
- No spacing between cancel & reset buttons on the password reset page

## Added
- Warning message for unsupported browsers on iOS

# [3.15.14] - 2019-01-22
## Added
- Delete icon was missing in search mode

## Fixed
- Login got stuck on older Safari browsers
- Editing invalid emails did not properly update the composer
- Enable/disable keyboard shortcuts didn't work without a page refresh
- Some buttons had different mouse hover effect
- Verified address lock didn't appear until a message is opened
- Decryption error appeared for messages on Chrome browser

# [3.15.13] - 2019-01-16
## Fixed
- Fixed minor CSS issues in the composer
- Fixed loading issue with some older Safari browsers
- Reactivate all keys button was broken
- Fixed a typo when adding a DKIM record
- Contacts don't show as suggestions if you add and remove them as recipients
- OpenVPN/IKEv2 credentials were not generated upon login for some users

# [3.15.12] - 2019-01-10
## Fixed
- An issue with changing signatures for some subusers
- On the filters page the created filters were listed with a drop-down animation

# [3.15.11] - 2019-01-08
## Fixed

- Sender verification failed on some old messages
- Mark As Read button was missing a border on the left side
- The signature is disappearing from the default address in some cases
- The back arrow didn't show the previous email
- Load remote content did not work in some cases
- Some behaviour fixes for IE11

# [3.15.10] - 2019-01-03
## Fixed
- ESC key was unresponsive in some cases
- Amount Mismatch error was shown when using certain coupons
- Login issues for some sub-user accounts
- 'Empty Trash' didn't refresh the UI

# [3.15.9] - 2018-12-23
## Fixed
- Create draft with `@pm.me` address on FREE account
- Old Safari 9.x can't load the web-app

# [3.15.8] - 2018-12-21
## Fixed
- Saving message as draft sets an encryption for non-ProtonMail addresses
- Reports from users about logging in with 1Password

## Changed
- Update "More info" link to the latest blog post (#8255)

# [3.15.7] - 2018-12-20

## Changed
- Update all translations

# [3.15.6] - 2018-12-19
## Added
- App suggestion when visiting the web version from a mobile device
- Select All/Deselect All checkbox when adding multiple recipients
- New version notification under the User menu

## Fixed
- Fixed a bug where the SRP modulus signature was not verified by the web client. Reported by N. Kobeissi and S. Zanella.
- Incorrect error message was shown when adding a new addresses to a custom domain
- Free users were unable to delete multiple contact groups
- Set focus on Name input field when adding a new contact
- Gift codes were not properly working at signup
- Contact groups that contain contacts with invalid PGP keys couldn't be edited in the composer
- Verifying contacts didn't refresh the contact view
- Incorrect padlock color for some messages
- Failure to reactivate an email key blocked the display of contacts
- Click on copy address closed the message
- Dropdown menus overlaped with clicking on different contact categories
- Invalid display of long custom domain names
- Contact group long names didn't fit into the import modal
- Changing contact group name didn't update in all locations
- An address could be missing after being removed from a contact group
- Log out button was unclickable when in the Auto-Reply tab
- Some characters were not recognized in the password
- Select all contacts broke the checkbox alignment
- Newly created additional address did not show in the advanced search menu

## Changed
- Setup account where keys don't exist
- Plaintext behavior for new messages

# [3.15.3] - 2018-11-23
## Fixed
- Changes on the Dashboard did not update if you use the BlackFriday offer
- Mobile: Menu, Search and Compose buttons were inactive with a minimized composer
- Some scrolling issues

## Changed
- Don't show the Balck Friday offer modal every time the user goes to the dashboard page

# [3.15.2] - 2018-11-22
## Fixed
- "Unknown ASCII armor type" error was shown when importing private key for contacts

## Changed
- Behavior for some options on the Dashboard

# [3.15.1] - 2018-11-22
## Fixed
- "Add multiple recipients" modal did not clear the selected addresses in some cases
- "Add multiple recipients" modal added the selected addresses in all open composers
- Email type dropdown was not closed when rearranging addresses
- The printing font was very small for some documents
- Some error messages appeared when accessing Advanced contact settings

# [3.15.0] - 2018-11-20

[![ProtonMail v3.15 has been released!](assets/img/v3-15.jpg)](https://protonmail.com/blog/protonmail-v3-15-release-notes/)

[ProtonMail 3.15](https://protonmail.com/blog/protonmail-v3-15-release-notes/)

## Added

- Contact groups
- Read receipts

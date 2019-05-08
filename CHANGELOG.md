# [3.15.32] - 2019-05-08
## Fixed
- Signing up for a new account didn't properly redirect in some cases.

# [3.15.31] - 2019-05-08
## Fixed
- Creating a filter in some conditions displayed "e.replace is not a function" error message.
- Some variables in the sieve filters were not properly handled.

## Changed
- Some improvements on the signup process.
- Some improvements for the open link modal.

# [3.15.30] - 2019-05-03

## Fixed
- Some URL links were not shown properly and could not be opened on Safari browsers.

# [3.15.29] - 2019-04-26
## Changed
- Safari is still opening link even with preventDefault()

# [3.15.28] - 2019-04-26

## Added

- We have added a new link confirmation feature to allow users to verify links before opening them for added protection against phishing.

# [3.15.27] - 2019-04-17
## Fixed
- Email address was not shown in the To/CC/BCC fields if it was between `<>` signs
- Applying a gift code on signup caused an error message in some cases

## Changed
- Member creation process was not working properly
- Slight modification of mark as spam behavior on conversations

# [3.15.26] - 2019-04-05
## Fixed
- "Invalid username" error if a blank space is added in the username field

# [3.15.25] - 2019-04-03
## Fixed
- Labels / Folders are shown in scrolled view after login

# [3.15.24] - 2019-04-03

## Fixed

- 'Show attachments' button was missing in the composer
- Label and Folder creation caused some issues with the notification toggle for Folders
- Signup on IE11 was not working properly in some cases
- Set up account panel was not centered in mobile view
- Labels weren't displayed properly on IE

## Added

- Missing translations in Polish

# [3.15.23] - 2019-03-28

## Fixed

- Revoked or expired keys were not removed on import

## Changed

- Prevent auto-submit on input field in filter modal
- Show error if the key parsing fails

# [3.15.22] - 2019-03-27

## Fixed
- Keys in imported contacts were not validated in some cases
- Forgot username link didn't redirect to correct localized pages
- Show password button on signup was not vocalized
- The language was not automatically detected in some locations
- Trying to log in with a disabled account did not show the proper modal

# [3.15.21] - 2019-03-19

## Fixed

- The Delete button was not visible in the Drafts folder
- The trash icon disappeared if you move a message to trash twice from the All Mail folder
- Contacts were missing after export
- Creating a contact on IE was broken
- French leaks in the English translations
- Link for beta was not clickable on the german version
- "Too many recent API requests" error was shown when exporting contacts


## Added

- ECC key generation

# [3.15.20] - 2019-03-06

## Fixed

- Signup codes were automatically resent
- Contact remained in a group even after removing the email addresses
- Delete attachment button was not vocalized
- Attachments size was not updated when removing attachments from the composer
- Page scrolled to the bottom after editing a folder or a label
- Learn more link on storage warning modal was broken
- PGP messages couldn't be forwarded after replying
- Deleting contact removed a wrong one in sime cases
- New drafts were marked as unread
- The top of the contact group icon was hidden.
- Design issue with the page selector dropdown on the Contacts page
- Changing the text direction in the composer did not show the cursor in the correct location
- The composer was overlapping/going out of the window border when resizing the window
- Images were not properly imported from VCF files
- Localization improvements

## Changed

- Confirmation code behavior on the signup page
- Improved expiration message information

# [3.15.19] - 2019-02-20

## Fixed
- Invalid message body error was shown when trying to reply to an email (encrypted externally)

## Changed
- Avoid multiple saving for draft

# [3.15.18] - 2019-02-19

## Fixed
- Old contact email address was used in reset password warning modal
- Importing a contact in vCard format incorrectly displayed the Birth date
- Reset password modal didn't fit when language was set to French
- Using "Enter" on the keyboard proceeded to the next screen without entering a password on signup
- Add to contact group button has underlined when hovering over it on Firefox

## Changed
- Contacts auto saving behavior
- Signup email code submission

# [3.15.17] - 2019-02-13

## Fixed

- Marking message as spam did not always show the remove contact modal
- Password reset did not work if the username was autofilled
- Long text patterns did not display properly in the custom filters modal
- Error messages were shown for some modals if the "Cancel" option was selected
- Importing a key that already exists was added again
- In some reply cases removing an address in the "CC" field also removed the addresses in the "To" field
- Some "Learn more" links were leading to wrong URLs
- Pressing "Esc" did not close the Hotkeys modal
- PGP Encryption settings were not set for all imported email addresses
- Importing a contact with PGP encryption for a second time caused the UI to freeze
- "View source code" option did not show if message is blank
- Email verification code was saved as auto-fill suggestion by the browser
- "e.match is not a function" error was shown in some cases when forwarding a message

## Changed

- Notification are no longer shown if an error happens during an unsubscribe action

# [3.15.16] - 2019-01-31

## Fixed
- Multiple catch-all addresses could be selected
- Composer contact group email list had random line height
- Message remained after it is deleted from the trash
- Wrong email was shown when selecting trust public keys
- Login didn't work on some older browsers on iOS

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

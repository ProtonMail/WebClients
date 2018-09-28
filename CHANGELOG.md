# [3.14.13] - 2018-09-28
## Added
- UX Improvement - Label creation
- improvement - make adding filters easier to use
- Contact key status has an incorrect tooltip
- Storage warning modal

## Fixed
- Can't create a weekly automatic reply
- Marking a conversation as unread triggers an error
- Conversation doesn't move to correct spot and messages/time is not updated
- Retry action doesn't work
- Missing strings for localisation in main EN file
- API V3 Error handling
- When adding an additional address to a contact, the display format of the addresses is changing.
- Account can be created with an invalid recovery address
- Marking a conversation as unread triggers an error
- Contacts order is not saved
- The notification element is visible, blocking clicks when it's not displayed
- Ultra slow typing of recipient in the composer
- Pressing the ADD ADDRESS in Addresses/Users on a free account does nothing
- Correction
- If you copy+paste remote images in the composer, they will show up twice (again)
- Replying and Forwarding a message displays an incorrect From address after changing the From address
- Human verification by email displays both "Verification code sent" and "Please use a non-ProtonMail email address"

## Improved
- Add a contact with advanced settings doesn't work
- Change the "Reactivate Address Keys" button to "Reactivate Keys"
- Change the "Reactivate Address Keys" button to "Reactivate Keys"

## Changed
- toggle for IE11, initial is not supported and autoprefixer is broken
- listener autocomplete cache
- refresh cache autocomplete name
- 401 promise was not cleared in the catch handler
- Conversation wrapper not flexing the whole height
- Proton signature toggle was not updating
- Human verification fail on Edge
- Expected locale in underscore

# [3.14.12] - 2018-09-13

## Fixed

- Fixed a signup issue with some languages

# [3.14.11] - 2018-09-12

## Fixed

- Wrong messages shown in some cases when move actions are applied
- Time formats were incorrectly showing 24-hour time
- Sign external messages setting did not update correctly

# [3.14.10] - 2018-09-07

## Fixed

- Unread counter was not working in custom folders / labels

# [3.14.9] - 2018-09-07

## Changed

- Hide advanced settings button in add contact details

# [3.14.8] - 2018-09-07

## Fixed

- Folders and labels were missing from the left sidebar menu

# [3.14.7] - 2018-09-07

## Fixed

- Keyboard shortcuts were not working properly
- Fixed minor modal issues

## Changed

- Save button only visible in edit mode for contact
- Review signature structure

# [3.14.6] - 2018-09-06

## Fixed
- Address Keys buttons aligned in one line
- Star icon was pushed to bottom
- Keyboard shortcuts didn't work
- The Tutorial was not closing for new users
- Some toggles were not properly saving

# [3.14.5] - 2018-09-05

## Added
- Visible focus
- Allow address reordering in Settings>Addresses/Users
- Set the email subject as document name when using the Print option to save message as pdf
- Missing strings in source file for translations
- Consistency between Settings -> Account -> Identity and Settings -> Account -> Address Priority
- Changes in message metadata

## Fixed
- Custom theme fixes
- Changes for sending and updating messages
- HTML tags in plaintext messages not escaped
- Users order in Settings>Addresses/Users
- Advanced contact settings general fixes
- Using the LastPass extension makes the "SUBMIT" button inactive
- Attachments didn't appear in some cases
- Account creation fix for unavailable usernames
- Sent / Drafts folders appearance fix for moving messages
- Decryption error fix for some cases
- Fixes for inline images
- Error when sending message to disabled addresses
- Occasionally get "Invalid input" when reordering labels
- Insert image and Insert link options from composer did not work on Safari
- Composer window does not open when replying to a message (plaintext)
- Externally PGP encrypted files are forwarded decrypted with the wrong extension (.gpg)
- Dark Theme Colors Fix

## Improved
- Retain selection of Emails after applying labels
- Download all embedded images at once improvement
- Improve conversation labeling

## Changed
- Make "Set primary" clickable
- Custom radio buttons in settings
- Make custom radio and custom checkbox focussable
- Make toggle focussable
- Extract single vCard field
- Import contacts
- Adjust autocomplete height list
- Load remote content when sending message
- Embedded images detection

# [3.14.4] - 2018-08-07

## Added

- Improvements for unsubscribe feature
- Add empty all draft action

## Fixed

- Save contact changes from advanced modal issue
- Fixed issue with some messages not rendering properly
- Fixed custom filter folder selection
- Fixed email address detection between "< >" for plain text messages
- Fix for some inline images that weren't loading properly
- Fixed overlapping of icons/labels on Firefox
- Fixed issue with importing keys on IE11
- Fixed login for VPN only user logging in for the first time
- Fixed detection of custom fields when importing .vcf file

## Changed

- Report phishing now also sends the message to spam
- Hide action column on keys page for non private users
- Display of days selection on Auto-rply screen
- Verifying with compromised keys gives a correct warning
- Reviewed bug modal design
- Changed the handling of feedbacks when deleting an account

# [3.14.3] - 2018-07-26

## Fixed

- Clean missing conversations: "Conversation doesn't exist"
- Disallow phishing reports of the message cant be decrypted
- Avoid to have SAVE and SEND request in the same time
- "Create a new folder" was not working properly
- Issue when trying to send a message without a subject

# [3.14.2] - 2018-07-25

## Fixed

- Fix paste links in old browsers
- Fix SMS input on signup page

# [3.14.1] - 2018-07-25

## Changed

- Improve recipients modal title

## Fixed

- Add learn more link for This email has failed its domain's authentication requirements
- Login redirection was not working

# [3.14.0] - 2018-07-11

[![ProtonMail v3.14 has been released!](assets/img/v3-14.jpg)](https://protonmail.com/blog/protonmail-v3-14-release-notes/)

[ProtonMail 3.14](https://protonmail.com/blog/protonmail-v3-14-release-notes/)

## Added

- PGP support
- Address verification
- Manage address keys
- Add multiple recipients from the composer
- New session management options
- New option for reporting phishing messages

## Changed

- Expiring messages
- ProtonMail addresses in the composer
- Remove a contact on mark as spam

## Fixed

- Some issues with importing contacts
- Copy/paste images in the composer
- Wrong date in some cases when using search
- Some images were not loaded from certain newsletters
- Additional bug fixes

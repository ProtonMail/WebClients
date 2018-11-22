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

# [3.14.36] - 2018-11-17

## Fixed
- Custom folder/label list in left nav bar is not scrollable at certain resolutions/zoom levels
- After clicking the "create account" button, the page defaults to FR language

# [3.14.35] - 2018-11-17

## Fixed
- Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.
- Top menu overlaps wit other page content

## Changed
- Storage has an incorrect addon mapping

# [3.14.34] - 2018-11-16
## Added
- Spelling mistake in Settings > Appearance > Toolbar

## Fixed
- Top menu overlaps with other page content

# [3.14.33] - 2018-11-16

## Fixed
- Sending a message was not working
- Refresh contact on update
- Removed `z-index` property to solve the header issue
- Review signup + labels on mobile

# [3.14.32] - 2018-11-15

## Fixed
- Adding new label from dropdown list doesn't refresh the dropdown list
- Invalid password field height

# [3.14.31] - 2018-11-15

## Added
- Link to the beta version on the signup page

## Fixed
- Clearing contact photo didn't reset the preview image
- Selecting a label didn't close the drop-down menu
- Change organization name button was misaligned
- Creating a new organization didn't update the main input field
- Creating an organization showed an incorrect amount of storage used by the admin
- Full fingerprint was not shown when hovering over it in the advanced contact settings
- "Move to" and "Label as" inbox actions don't work in some cases
- When the first label or folder has an emoji, the top of the emoji was cut off
- Two remove buttons appeared when searching contacts
- Vcard exported incorrect picture URL structure
- Free users were unable to use unsubscribe from mailing lists in some cases
- Some visual issues with Contacts display on certain resolutions

## Changed
- Login page rearranged to include link to the beta version
- Label UI on labels / folders page
- "Send" action behavior with some invalid addresses

# [3.14.30] - 2018-10-30
## Fixed
- Two "++" are added if you respond from a plus alias address
# [3.14.29] - 2018-10-30
## Added
- Added Reply/Reply All/Forward options for emails that can’t be decrypted

## Fixed
- Some newsletters did not display properly
- Sometimes wrong suggestions were displayed in the "To:" field
- The "from" email was displayed twice in draft messages from custom folders
- The "other" phone type was displayed as "X-other"
- When unsubscribing from a newsletter with a + alias the response was sent from the main address
- Advanced settings warning was incorrectly shown
- The Dashboard was not showing properly in Internet Explorer for paid accounts
- Adding phone numbers and emails was not properly shown in the Contact field
- To/CC/BCC were broken if too many emails are added
- When configuring Auto-Reply the "SAVE" button did not work in some cases
- Changing the "From" address disaplayed both old and new names in the "From" field in a custom folder with a draft message
- Tooltip was displayed behind the VPN Protection info window
- Hitting Backspace after deleting an address in the To field acted as the browser's back button
- Padlock icons in the composer were partially hidden

## Changed
- Email address handling with + aliases
- Show 'Invalid access token' error instead of the 'Refresh failed' error

# [3.14.28] - 2018-10-24
## Added
- Warning for email addresses that fail validation

## Fixed
- Clicking on the new mail notification and clicking delete results with the second email being deleted
- Performance issues related to loading messages

# [3.14.27] - 2018-10-24
## Fixed
- Opening a message can take time
- You cannot Unstar a message once it's starred when threading mode is off
- Hash for vendor not properly generated because the hashes for the files are the same
- Keys don't appear for member

# [3.14.25] - 2018-10-23
## Fixed
- Keys saved in the cache were erased after an event

# [3.14.24] - 2018-10-23
## Added
- Add code of conduct file

## Fixed
- Fix issues regarding newly generated keys
- Error message "Uploaded key does match selected key." is shown when the key doesn't match.
- [IE 11] PGP-Encrypted padlock takes up lots of space.

# [3.14.23] - 2018-10-19
## Fixed
- Fixed an issue with keys generation for sub-users

# [3.14.22] - 2018-10-19
## Added
- An error message is now displayed for all users if the account is delinquent

## Fixed
- iCalendar ( .ics) files could bypass the loading of remote content setting
- Header was not displayed properly in the domain wizard on Firefox
- iOS rendering issue
- Image for a contact was not displayed properly in Internet Explorer
- Addresses were not alligned properly in Settings/filters on Internet Explorer
- Time displayed next to a sent message was the time when the draft was saved, not when the message was sent
- Opening the last message in the "show unread" mode caused an issue with viewing
- "Message sent" notification was not showing when responding from encrypted messages sent to non ProtonMail addresses

# [3.14.21] - 2018-10-17
## Fixed
- Advanced settings did not save changes
- The scroll bar didn't show in Contacts view

# [3.14.20] - 2018-10-17
## Fixed
- "You have no contacts" message was not centered on IE
- After trusting keys the lock icon didn't update properly
- "Cannot read property 'Keys' of undefined" error showed when pressing Escape in the signature editor
- Minor issue with loading messages
- "Invalid input" error message when you edit a contact with some characters in the Display name
- Importing a public key for a second address on a same contact replaced the key on the original address
- Mark email addresses that fail validation in red
- Some fields in the contacts were not displayed in certain cases
- "[object Object]" was shown as an error message if invalid credit card data was entered

## Changed
- Print now opens as
- Changes to the labeling for conversations/messages
- Some errors were not displayed properly
- Labels attribute was missing in some cases
- Display embedded content was not working properly

# [3.14.19] - 2018-10-12
## Fixed
- Fixed remove/clear input button on IE
- Tutorial didn't start if triggered manually
- Custom filter options dropdown was closed after each selection.

## Changed
- View headers is now shown in the same window as a pop-up

# [3.14.18] - 2018-10-10

## Fixed
- You cannot reply to a PGP message, an error "Invalid message body" was shown

# [3.14.17] - 2018-10-09

## Added
- Increase domain limit to 100 for the professional plan
- Adding URL in Contact details was not shown as hyperlink

## Fixed
- Can't access ProtonMail with an unpaid invoice on the account
- Some menus remained open until something else is clicked.
- Label loading issue if message was moved to a custom folder

# [3.14.16] - 2018-10-05

## Fixed

- Copy, cut and paste was not working with Edge browser
- Advanced Sieve editor was broken

# [3.14.15] - 2018-10-04
## Fixed
- Requesting desktop permission Safari crashes the login process

# [3.14.14] - 2018-10-04
## Fixed
- "Cannot read property `map` of undefined" error in console
- After deleting a new unread message, the counter from All Mail folder doesn't refresh itself automaticaly
- Image in Drafts does not load even if Load embedded images is enabled
- composer took too long to open with some addresses
- Edit contact phone broke the format

## Changed
- translation format issue in templates
- New signup username checks
- dropdown labels behavior
- Don't show errors for missing keys

# [3.14.13] - 2018-09-28
## Added
- Contact key status tooltip
- Storage warning modal

## Fixed
- Can't create a weekly automatic reply
- Marking a conversation as unread triggers an error
- Conversation doesn't move to correct spot and messages/time is not updated
- Missing strings for localisations
- When adding an additional address to a contact, the display format of the addresses changed
- Account can be created with an invalid recovery address
- Marking a conversation as unread triggers an error
- Contacts order is not saved
- The notification element is visible, blocking clicks when it's not displayed
- Slow thping issue in some cases
- Pressing the ADD ADDRESS for free accounts didn’t show correct error
- If you copy+paste remote images in the composer, they will show up twice
- Replying and Forwarding a message displays an incorrect From address after changing the From address
- Human verification by email displays both "Verification code sent" and "Please use a non-ProtonMail email address"

## Improved
- Label creation
- Filter creation
- Add a contact with advanced settings
- improvments for IE11

## Changed
- Proton signature toggle was not updating
- Human verification fail on Edge

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

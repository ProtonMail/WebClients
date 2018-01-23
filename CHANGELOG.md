# [3.12.24] - 2018-01-18
## Fixed
- When you reply to an outside (password protected) message, you can see [object HTMLhtmlElement]
- Folders/Labels are not showing for some users
- Remove/Hide "Notification" toggle for labels
- When you click on the "Insert image" button for the signature, it disappears.
- Sidebar folders/labels scroll breaks on some occasions
- Load remote content doesn't work properly when set to "manual", while load embedded images is auto

## Changed
- Set ClientType for bug request
- load embedded with cache Load a message with an embedded (auto load), go to settings, the go back to the message. As there is a cache it's too fast for the $digest.
- Wrong error message for the attachment size limit

# [3.12.23] - 2018-01-16
## Fixed
- Cancel button in 'Add Filter'

## Changed
- deploy prod with /api

# [3.12.22] - 2018-01-16
## Added
- Reply header contains un-standard information and has a typo
- Add info if you already have a custom displayName/Signature
- Switch from Underscore to Lodash

## Fixed
- System keeps asking for password when you try to enable disabled addresses (aliases) while on the free plan
- Selecting bold/italic/underline moves the pointer to the first line
- Warning icon seems to be styled improperly
- [DEV] Changing row to column view causes small problem
- Delete button is showing for ProtonMail addresses
- [DEV] Arrows are shown in the sidebar scroll
- Upgrade and Settings buttons are 'active' at the same time
- [QA] Drag & drop attachments in multiple composers freezes

## Changed
- 2FA process was not working properly
- adblock squire issue, add display important (#6253)
- Use CONSTANTS
- Use import constants
- Properly unsubscribe "updateUser" and "mailSettings" events
- Use the body with the 'rows' class
- Switch layout
- displayName || firstEmail
- display the success after the event call
- layout buttons need to be initialized
- the usage space bar in Dashboard was always full
- download attachements
- reduce behavior
- $digest message directive on error + handlerError
- load the locale on auth

# [3.12.21] - 2018-01-10
## Added
- Switch from Underscore to Lodash
- Improve auto-responder design
- Escape button doesn't close the composer when To/CC/BCC lines are selected
- Autoresponder UI Improvement for Free Accounts
- improve the experience for users whose protonmail account was disabled
- Web client is using deprecated 'Inline' parameter when uploading embedded attachments

## Fixed
- The scroll bar in the signature box (in settings) is not working properly
- android ux problem
- [UX improvement] Replying encrypted from outside
- Username overlapps with side-bar menu on default Blackberry browser
- Long subject on mobile browser takes up the whole screen, prevents scrolling
- You cannot save contact after "This form is invalid" error
- The theme changes only after you refresh the page, not after clicking save
- Decryption error for some messages (from PayPal, Steam, other) mostly on Edge browser
- When a message is already opened and 2 other messages are being selected, pressing "T" removes the already opened message.
- Edge: Drag & drop messages problem
- Signature is not changing when PlainText mode is on
- drag and drop box size
- filter long content ux bug
- You cannot compose a message after selecting "default signature" in Settings
- Broken Re:/Fw: treatment

## Changed
- don't show overflow-x in subject
- #6217 - When we move elements, numberElementChecked is set to 0
- pmView binding name
- Lazy load app for printer state

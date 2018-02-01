# [3.12.28] - 2018-02-01
## Changed
- c cannot be a global binding
- Save draft when pressing ESC in the composer
- Autosave in plain text mode

# [3.12.27] - 2018-02-01
## Added
- "To: Undisclosed Recipients" added if no recipients in "To" and "CC"
- Default Display name is no longer assigned to alias addresses
- Add hotkeys in contacts
- Switch to API v3

## Fixed
- Edit signature button from Settings>Name/Signature does not work
- Insert image button remains selected after you insert an image in the composer
- The normal mode is not recognized when replying (if plain text compose is set to default)
- Double scrollbar in composer
- The option to download attachment is available on the Print window
- Importing contacts fix
- Wrong error message for disabled accounts
- ProtonVPN wrong number of connections for Professional Plan
- Attachments with large text in Plaintext mode are not shown correctly
- Create new alias empty name error + UX improvement
- Error message after first login on a new account
- Contact actions for contacts with the same name
- Keyboard shortcuts are too sensitive - while you are holding the key the actions are not stopping
- The "\" symbol is added to the contacts name if "" are used.
- Bug report link in sidebar alignment issue in mobile
- Broken plaintext editor via option menu composer
- Keyboard shortcuts work in the background when you have a pop-up window displayed
- When you send a message only to BCC, the recipient sees the To field as empty
- Folders/Labels are not showing
- Address field doesn't support semicolons
- `meta+s` throw error when the context is not on "composer"
- Inconsistency for addresses with local part of 64+ characters
- Encoding for tag names
- iOS mobile browser send button in horizontal composer won't show

## Changed
- Color popover hidden in the signature squire editor
- Handle response on settingsMailApi

# [3.12.26] - 2018-01-25
## Fixed
- "Learn more" link for invalid searches does not link to KB
- Invalid recipient issue

## Changed
- Account creation was crashing
- Dashboard route was unactive

# [3.12.25] - 2018-01-23
## Added
- Change expiration icon
- Change log / Release note modal
- Change settings sidebar icons
- RTL support for Squire

## Fixed
- Bulleted/Numbered lists display issue in Chrome when aligned to right
- label settings: if i have many labels, I can't move the bottom label to the top in one time.
- Incorrect error message when sending to outside email addresses with expiration but without password
- custom signature UI problem
- Scroll appearing in message content
- Reply to text/plain message
- Compose window may be hidden with some viewports
- custom signature UI problem
- Admin privileges revoked when changing layout
- did deploy reset the hide/show sent setting?
- Alignment issues with contact details
- Pressing "Enter" in the composer scrolls the text box up automatically
- Writing continues in URL
- Verification/decryption error in contacts after reactivating keys

## Changed
- Layout state was not reflected on chooseLayoutBtns component
- translate response title
- Active settings state for autoresponder page
- progressbar value rounded now
- Load custom theme after styles

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

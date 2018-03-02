# [3.12.38] - 2018-03-02
## Added
- Add title for folder/label names in the filter modal

## Fixed
- “Draft does not exist” or “Conversation does not exist” error message shows up in contacts tab

## Changed
- Add premium address for every paid user in the address modal
- Use ReplyTos instead of ReplyTo
- Replace html2canva by file input for screenshot

# [3.12.37] - 2018-03-01
## Changed
- Allow member to login and setup their account
- Call unsubscribe properly

# [3.12.36] - 2018-02-28
## Changed
- Authentication review (SessionToken / UID)
- Filter modal UX improvement

## Fixed
- Composer dropdown for the content format is not showing properly on mobile

# [3.12.35] - 2018-02-28
## Added
- Add MERGE button in the preview contact modal
- Increase the number of VPN connections for the Professional plan
- Added option for reactivating contacts and email keys separately

## Fixed
- The purple marker was not scrolling the page up/down after you have opened a message
- Hide the Wizard Button on the Domains tab if the setup is done
- Report bug button is not working if screenshot is enabled for some browsers
- Clicking reply on message removes the option to load inline images
- ICS preview: opening msg with event overwrites all open previews in same conversation with same date
- Edge: Back to mail button was not working
- Unicode in events was not working
- Number of users on the Professional plan not shown correctly after upgrade
- Coupon code is still used from the current subscription if it exists
- Download contact was not working with multiple names

## Changed
- Get the keys dynamically when reactivating them
- Move merge button to the right in the preview contact modal
- Hide the clear button if the placeholder photo is set
- Clean photo placeholder
- Add CLEAR photo button
- Display an error message if the image upload fails

# [3.12.34] - 2018-02-23

## Fixed

- Switching draft in plain text was broken

## Changed

-  Close the payment modal if the subscription change to avoid the "Amount Mismatch" issue
- Add more `‐` for the Original Message separator

# [3.12.33] - 2018-02-22

## Changed
- Solid separator when reply / forward
- Emails are technically case-sensitive

# [3.12.32] - 2018-02-22

## Added

- Realign columns on payment tab
- 'Add Payment Method' pop-up window is not closing instantly
- Too many recent failed login attempts error displayed
- Ability to add a phone number in the signature
- Improve the contacts suggestion in the composer

## Fixed

- "Label updated" message was shown when you change notification settings for a folder
- Display bug in "preview contact" if you have a long note
- When merging contacts the email address shows up twice if letter case doesn’t match
- Close the popover when choosing an action in the composer toolbar
- Download button for ICS invites was not working
- UI issue in the dashboard if you have the two-year plan and CHF as currency
- Text overlapping when "Load remote content" is set on "Manual".
- Clicking `A` or `T` once on the keyboard moves two messages to trash or archive
- Content is not loading after sending from draft in a certain case
- Remove the TYPE=x-fn added to the contact vCard by mistake
- Importing the same contacts shows two email addresses until you refresh the page
- Wrong error message when canceling the downgrade process
- Selecting a taken username block the signup process
- Contact scroll was not possible in tablet layout
- When you add a custom domain it shows up twice

## Changed

- Remote content and embedded images are now loaded when replying on encrypted outside message
- Improve the folders / labels sidebar to auto scroll during drag and drop

# [3.12.31] - 2018-02-14
## Added
- Merge contact functionality
- Preview ICS attachments in emails

## Fixed
- Improve re-ordering of the addresses in Contacts
- "Contact does not exist" error when you delete a contact with shortcuts then click on the right arrow
- The arrow for the font options does not work on Firefox
- Fix alignment in Professional plan modal
- Improved time for the unread counter to be removed
- Only display the first name for the contact view
- Cannot set the signature in plain text mode when creating a new address
- Inconsistency with the contact markers after refresh/switch tab
- Encrypted Facebook message was not opening
- Adding a `.to` domain fails to generate Verify value/data
- Checkbox cannot be ticked with the keyboard in the contact list
- Selected color is not updated in the color popover
- IE: Changing default composer mode and composer direction does not work
- "Switch to one password mode" was still displayed after switching to one password mode
- On Firefox the contacts list header is floating improperly
- You can switch to disabled or enabled for password recovery when you enter the wrong password
- Expired EO message link goes to the wrong page
- Folders/Labels were not showing on old browsers (mostly on Safari)
- The purple marker disappears when you click on a checkbox in Contacts
- When you forward a message the `To` line shows up twice in Show details

## Changed
- By using toUnixTime() the value is set in UTC + Add timezone in the ICS viewer
- Mismatch amount issue: Close the PayPal tab if the current subscription change
- Make sure we reset all tabs for PayPal
- Upgrade translations and fix generation

# [3.12.30] - 2018-02-07
## Added
- Improve the BTC payment message.
- Improve the "name" and "email" sorting in the Contacts page
- Support pasting "(address@domain.com)" into the "To" field
- Make the growler more precise
- Contacts - copy from the listing doesn't work
- Improve decryption error for a message
- Name/Signature change

## Fixed
- Cannot activate keys in some occasions
- Cannot view/edit the signature for an address
- New contacts appear at the bottom
- An error message is not showing if you try to reply from a disabled address
- Custom signature is not showing
- Change address priority button does not work
- URL image added in signature when you click Insert file (it should be Insert URL)
- "Undisclosed recipients" showing when it shouldn't
- Error messages show in OS language instead of the language users set
- The purple selection marker and the selected contact marker disappear when you scroll up and down
- Cannot read property 'localeCompare' of undefined with random 'sort' query
- Shift select for selecting multiple messages
- Text between "< >" disappears when minimising the composer in plaintext mode

## Changed
- Make sure we make a copy before to use sort
- Remove disabled addresses in the address priority section
- Align improvements
- Keyup handler for other location
- Don't let the user enable / disable premium address

# [3.12.29] - 2018-02-02
## Fixed
- Created folder or label shows up twice with the same name when you go back to messages and when you go back to Folders / Labels, the page is blank.
- Cannot reply/forward a messages on iOS browsers

## Changed
- Handle contact errors during import

# [3.12.28] - 2018-02-01
## Changed
- `c` cannot be a global binding
- Save draft when pressing ESC in the composer
- Autosave in plain text mode

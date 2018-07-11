# [3.14.0] - 2018-07-11

[![ProtonMail v3.14 has been released!](assets/img/v3-14.jpg)](https://protonmail.com/blog/protonmail-v3-14-release-notes/)

[ProtonMail 3.14](https://protonmail.com/blog/protonmail-v3-14-release-notes/)

## Added

- PGP Support
- address verification
- manage address keys
- add multiple recipients from the composer

## Changed

- expiring messages
- ProtonMail addresses in the composer
- remove a contact on mark as spam

## Fixed

- some issues with importing contacts
- copy/paste images in the composer
- wrong date in some cases when using search
- some images were not loaded from certain newsletters
- additional bug fixes

# [3.13.0] - 2018-03-29

[![ProtonMail v3.13 has been released!](assets/img/v3-13.jpg)](https://protonmail.com/blog/protonmail-v3-13-release-notes/)

[ProtonMail 3.13](https://protonmail.com/blog/protonmail-v3-13-release-notes/)

# [3.12.48] - 2018-03-29

## Added

- Add full `@pm.me` support
- Add `Insert File` in Settings -> Account -> Signature -> Insert image

## Fixed

- Blank message issue with going back in Safari while a composer is open
- Cannot load web content in sent message
- Adding link to one image that is added into the signature generates a weird code
- URL link signature is not saved as a link

## Changed

- Addresses table in address domain modal

# [3.12.47] - 2018-03-28

## Added

- Improved display of messages received from Outlook

## Fixed

- HTML signature is not loading if you switch from Plain Text to Normal mode
- Minimized composer cannot be restored if you close a second composer window
- Refreshing a plain-text message shows HTML code
- Cannot access save button in the contact details modal when window size is small
- Line breaks are lost when forwarding or replying to a plaintext email
- Changing the composer from normal to plaintext sets the cursor at the bottom on Edge browser

## Changed

- Changes to attachments handling
- Add default Subject and Body when unsubscribing
- Review contact list table
- Review ProtonVPN page

# [3.12.45] - 2018-03-22
## Fixed
- The signature from the previous default address is showing if you change address priority
- Fix account creation bug happening under certain conditions
- Fix setup process for private member

# [3.12.44] - 2018-03-22
## Added
- Add a tooltip for daily notifications in Settings>Account

## Fixed
- Payments tab was broken on mobile browsers
- Properly update  the addresses selector
- Fixed "Learn More" link in Settings>Addresses/Users

## Changed
- Review the navigation bar

# [3.12.43] - 2018-03-21
## Fixed
- 2FA section was missing when 2FA was not enabled
- Display proper warning for pm.me address


# [3.12.42] - 2018-03-21
## Added
- Add an option to make image URL likns as well

## Fixed
- Images in HTML signature are not loading when sending the message from draft
- ICS attachment fixes
- Drafts don't open the composer
- Web content is loading in draft message
- Insert link and insert image buttons don't work in mobile browsers on Android
- Fixed form validation
- General composer fixes
- Fixed load plaintext message bug

## Changed
- Improvements with addresses handling
- Improvements with payments handling
- Review how we select the FROM address
- Use ng-src to prevent browser fetching incorrect img in contacts
- Sort labels collection by Order when receiving events
- loading plaintext draft message converted to html
- Wrong model called in some situations


# [3.12.40] - 2018-03-14

## Added
- Add Tooltip for "Log out all other sessions" in Settings -> Security
- Change the link for display name in Settings -> Account
- Improve the Human verification error message
- Close the tutorial if one navigates away
- Hide pm.me tab for members

## Fixed
- Unsubscribe button - Prevent automatically adding recipient to Contacts
- Delay in marking conversations as read or unread
- Verification error not showing for all contacts after a password reset
- Click anywhere to close editor popup
- "To" field missing when saving a draft and not clicking in the composer tab
- Loading images automatically when replying
- UI issue in the advanced search panel
- UI issue with the command palette
- (Edge) Drag&drop images show up twice in the composer

## Changed
- Undefined composer id
- Normalize icons size in the composer

# [3.12.39] - 2018-03-07

## Fixed

- Fix translation issue on placeholder attribute
- Can't switch to Plain Text on iOS mobile browsers
- Fix contact selection
- "Sent with ProtonMail" signature remembered after log out + log in on different accounts
- The custom signature is not changed when switching from address in plaintext mode
- In specific cases, the notification message "moved to Trash" would appear twice
- Several mistakes in the German translation

## Changed

- Add the screenshot input for Safari, Edge and IE
- Add CLEAR action in the bug report modal

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

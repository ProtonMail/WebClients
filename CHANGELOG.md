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

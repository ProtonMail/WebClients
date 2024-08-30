## August 2024

### Improvements

-   Added the ability to minimize the left side panel for a more customizable interface.

### Fixes

-   Fixed a scroll jump issue on the conversation list

## July 2024

### Improvements

-   Proton Scribe Writing Assistant: Launched for B2B customers to enhance writing productivity.

### Fixes

-   Fixed an issue in the Security Center where Proton Pass encountered problems when an extra password was used.

## Release 5.0.36 — Feb 21st, 2024

### Improvements

-   Improved performance on the "Move to Archive" and "Move to Trash" actions
-   Added "Set Proton Mail as the default mail application" option to the quick settings for Chromium-based browsers

### Fixes

-   Fixed an issue where some characters would appear missing on the Print preview in Firefox
-   Fixed an issue where the view would not update if selecting to filter by "Messages to this recipient" from the message view
-   Fixed an issue where the default font would not be used in the auto-reply editor

## Release 5.0.35 — Feb 7th, 2024

### Improvements

-   Improved interaction speed on the Conversation list view
-   Improved performance when loading Drafts
-   Improved instructions when setting up a custom domain

### Fixes

-   Fixed an issue where the "Move to" and "Label as" options would not be visible on the page if using "M"/"L" keyboard shortcuts at the bottom of a long message
-   Fixed an issue where the focus on the composer could temporarily be lost if starting a new message seconds after sending the previous one
-   Fixed an issue where sent messages could not be moved back to the Sent folder if moved to another destination by mistake
-   Fixed an issue where an expiration time could be set in the past
-   Fixed an issue where duplicated entries were displayed in the recipient suggestion field for email forwarding
-   Fixed an issue where empty conditions in Filters would be accepted
-   Fixed an issue where under specific circumstances a filter without a name could be created
-   Improved error messaging when accessing the last search results page
-   Fixed an issue where remote images would not be loaded under some specific conditions
-   Fixed an issue where more than one sender per email would be accepted as a search criteria

## Release 5.0.34 — Jan 23th, 2024

### New features

-   Introducing bulk actions for Mail! You can now choose an action to be applied to all messages/conversations in a given location, whether it's moving to another folder, labeling or marking as read/unread. Just select all messages on a page to see the new option.

### Improvements

-   When creating a folder, you can now find the respective parent folder more easily - just start typing the folder name and you will now see a list of suggestions

### Fixes

-   Fixed an issue where the option to unsubscribe from a newsletter would not be displayed when moving to Spam while conversation grouping is disabled
-   Fixed an issue where on rare occasions a "No messages found" screen would be displayed if switching between pages in search results too fast
-   Fixed an issue where the folder message count would be wrongly displayed for Snoozed messages
-   Fixed an issue where a reference to a base64 image would be added if switching the signature from plain text to HTML

## Release 5.0.33 — Dec 27th, 2023

### Improvements

-   Improved the error message for cases where the entered text in auto-replies is too long
-   Added the ability to display up to 200 messages/conversations per page. You can find the Setting in Settings > Messages > Messages and composing

### Fixes

-   Fixed an issue where the expiration date for messages could not be set to 2024
-   Fixed an issue where for long attachment names, the attachment tooltip would overlay the next message in a conversation making it hard to click on it
-   Fixed an issue where on particular days of the week, a duplicated entry would be displayed for Scheduled Send time suggestions
-   General performance improvements

## Release 5.0.32 — Nov 27th, 2023

-   Minor improvements and bug fixes

## Release 5.0.31 — Nov 8th, 2023

### New features

-   You can now reply to external calendar invitations that were forwarded to you

### Improvements

-   You can now add first and last names to your contacts in addition to the display name already available
-   Added link copying functionality in the link confirmation modal

### Fixes

-   Fixed an issue where the composer could become unresponsive after drag and dropping particular attachment types
-   Minor wording fixes

## Release 5.0.30 — Oct 18, 2023

### Improvements

-   You can now preview email attachments directly from the list view

## Release 5.0.29 — Sep 27, 2023

### Improvements

-   Added strikethrough option to the email composer

### Fixes

-   Fixed an issue where on some rare occasions changes would not be kept in the composer when sending the message while being offline
-   Fixed an issue where replying to a message and discarding the draft too quickly would result in the draft not being discarded on some occasions
-   Fixed an issue where a double-click was needed in order to open a draft message
-   Fixed an issue where sometimes drag&drop inside the composer would not work in the rich text context
-   Stopped suggesting to merge contacts that have been imported with "Unknown" as a contact name
-   Fixed an issue where typing any number followed by a full stop would automatically turn into a numbered list in the composer
-   Fixed an issue where a message sent to a newly created contact group would not print the contact group details fully
-   Fixed an issue where the "To" field could appear editable in a minimized composer when several composer are minimized at the same time
-   Fixed an issue where in certain emails, the text would be shown as white on a white background if changing the default colour to Dark in the OS preference on Windows

## Release 5.0.28 — Sep 13, 2023

### Improvements

-   Improved the app layout and increased the space reserved for email display
-   Increased the space for quick settings

### Fixes

-   Fixed an issue where the exact sending date would not be displayed in the tooltip when viewing an email
-   Fixed an issue where the icon on expiring messages would only show on page reload
-   Fixed an issue where a contact without family name could not be imported
-   Improved error messaging for cases where a contact without a family name and without email is being imported
-   Fixed sending the latest state of the draft after being offline
-   Fixed autocomplete issue in the Command palette

## Release 5.0.27 — Aug 16, 2023

### New features

-   Add the option to subscribe and unsubscribe to new product dedicated newsletters

### Improvements

-   Suggest to enable message content search when search result is empty

### Fixes

-   Fix moving all messages to Archive from the Sent and Drive folder when Keep messages in Sent/Drafts settings is enabled
-   Fix attachments dropzone in composer with plain text

## Release 5.0.26 — Aug 02, 2023

### Fixes

-   Fix an issue where the “Label as” shortcut would not work on Firefox when message content is in focus
-   Fix an issue where uploading big inline images into the composer would slow it down
-   Fix an issue where on some rare cases, embedded link in newsletters would not be clickable

## Release 5.0.25 — July 19, 2023

### New features

-   Message content search is now available to all Proton users
-   Links that contain known tracking parameters are now cleaned if the Block email tracking setting is active. This will prevent advertisers to track your interactions with emails.
-   Easily access important email actions using a command tool (CMD+K / Ctrl+K)
-   New setting allows to view the number of unread messages directly in the browser tab icon

### Fixes

-   Fix some email content that was not displaying correctly in dark mode
-   Fix "Has file" filter for message threads in custom folders

### Other

-   Our [Terms and Conditions](https://proton.me/legal/terms) have been updated

## Release 5.0.24 — June 28, 2023

### Improvements

-   Increase the click surface on email list items' checkboxes
-   Improvements of the drop zone in all apps

## Release 5.0.23 — June 14, 2023

### Improvements

-   Make composing messages to contacts and contact groups easier
-   Improve sidebar spacing and app switcher design
-   Contact images are now loaded through our anonymised proxy

### Fixes

-   Fix additional character when importing a .vcf file in contacts
-   Prevent from adding contacts without names in contact groups
-   Message content search fixes and optimisations
-   Other contact fixes

## Release 5.0.22 — May 17, 2023

### Improvements

-   Improve the loading of images in password protected messages sent to non Proton addresses
-   Place cursor outside of emails or links when they are pasted in the composer
-   Show message expiration time immediately when opening the sent message sent with a set expiration
-   Keep the email aliases and not the canonized email address used in the recipient field when saving a message in drafts

### Fixes

-   Refresh search results when local cache is being refreshed
-   Remove empty lines added in composer after an automatic signature is removed
-   Fix contacts imported from Proton Mail to be compatible with Thunderbird import

## Release 5.0.21 — Apr 26, 2023

### New features

-   If you benefit from a paid plan, you can now enable the automatic deletion of trash and spam messages after 30 days
-   Select only messages that have attachments with the new has file filter
-   Improve insert contact modal opened from the email composer

### Improvements

-   Prevent the app from crashing if the side panel apps crash

### Bug fixes

-   Fix unread email counters changing when performing a search

## Release 5.0.20 — April 5, 2023

### New features

-   Mark your email to self-destruct on a chosen day if you benefit from a paid plan

### Improvements

-   Add "In the morning" preset option for messages schedules to be sent later
-   Re-open the apps side panel on app refresh if it was previously open
-   Use the search keyword in labels and filters to automatically fill the name in the creation form if there was no result matching

## Release 5.0.19 — March 22, 2023

### Improvements

-   Extend the time window to schedule messages to be sent up to 3 months
-   Scroll down automatically when entering many recipients in the email composer
-   Improve insert contact modal opened from the email composer

## Release 5.0.18 — March 8, 2023

### New features

-   Emails from Proton will be marked with an authenticity badge that will replace the starring system
-   You can now schedule your emails to be sent later with pre-defined options for all Proton plans

### Improvements

-   Hide CC/BCC button from the composer when the fields are shown

### Bug fixes

-   Fix opening a message from a conversation thread when previous messages were deleted
-   Fix forward of emails with encrypted attachments

## Release 5.0.17 — February 15th, 2023

### Improvements

-   Improve loading of emails with many images
-   Automatically enable encryption and signature setting on contact key upload or WKD key pinning
-   Add support for disabling email encryption for contacts with WKD keys
-   Redesign of app growlers
-   Remove Move all to trash action from the schedules messages folder
-   Add auto-focus on search when contacts is opened from the side bar

### Bug fixes

-   Render correctly images when they include comments
-   Other small fixes

## Release 5.0.16 — January 25th, 2023

### New features

-   Enable SMTP submission setting for Mail Business plans

### Improvements

-   Add fallback fonts in the composer when not supported by the OS

### Bug fixes

-   Fix deleted drafts that are opened from the encrypted search results
-   Fix port number missing in link confirmation
-   Other small bug fixes

## Release 5.0.15 — January 18th, 2023

### New features

-   Add a right-hand side panel giving users the ability to use Proton Mail and view upcoming Proton Calendar events or contacts in parallel

### Bug fixes

-   Remove block domain option to match the app capability
-   Fix ordered list display when the font size is big in the composer
-   Other small bug fixes

## Release 5.0.14 — December 14th, 2022

### Bug fixes

-   Various UI fixes

## Release 5.0.13.0 — November 30th, 2022

### Improvements

-   Add the ability to edit or delete a folder from the side menu
-   Add the ability to edit or delete a label from the side menu

### Bug fixes

-   Fix an issue in which recipients in CC were not displayed in the original message that gets forwarded or replied to
-   Fix an issue in which a draft was still displayed in a conversation after clicking on undo
-   Fix an issue in which the focus on the composer could disappear
-   Fix an issue in which Twitter emails were not displayed properly

## Release 5.0.12 - November 16, 2022

### Bug fixes

-   Fix an issue in which the message view container was too tall

## Release 5.0.11 - October 26, 2022

### Improvements

-   Add the ability to block a sender on right click
-   We now load images by default and block senders from tracking you. This can be changed in the settings
-   Hover actions redesigned in the mail list

### Bug fixes

-   Bug fixes on block sender

## Release 5.0.10 — October 19, 2022

### Improvements

-   Add the ability to block a sender
-   Add the ability to hide/show system folder in the More section of the sidebar

### Bug fixes

-   Fix an issue in which labels in compact view were not aligned with the subject of the email

## Release 5.0.9 - October 6, 2022

### Bug fixes

-   Fix an issue in which the title of the email was not scrolling
-   Fix an issue in which the keyboard focus would be displayed without any keyboard input

## Release 5.0.8 - September 21, 2022

### Improvements

-   Add the ability to automatically assign a label to a sender
-   Add the ability to automatically assign a folder to a sender

### Bug fixes

-   Fix an issue where imported contacts were not properly displayed
-   Fix an issue where the expiration date was not displayed in some cases
-   Fix an issue in which selecting text in the search field did not open the search
-   Fix a bug in which Safari would freeze while an email is being composed

## Release 5.0.7 - September 7, 2022

### Improvements

-   Add the ability to quickly take actions from the list view
-   Change the emoji icon
-   Message list improvements

### Bug fixes

-   Fix an issue on label/folder name causing Safari to show the autofill
-   Fix an issue on the composer to avoid triggering shortcuts while a message is being sent

## Release 5.0.6 - August 17, 2022

### Improvements

-   Add an Emoji picker to the composer
-   Improve the inline attachments count verification
-   Add a modal asking users to unsubscribe from the mailing list when moving a newsletter to SPAM

### Bug fixes

-   Fix an issue where composer crashed when adding a specific recipient
-   Fix an issue where contacts could not be merged
-   Fix an issue where attachments were not displayed on print view

## Release 5.0.5 - July 27, 2022

### Bug fixes

-   Fix some minor display & alignment issues

## Release 5.0.4 - July 20, 2022

### improvements

-   Add the ability to move every message from a folder to trash

## Release 5.0.3 - July 6, 2022

### improvements

-   Add the ability to view messages from sender

## Release 5.0.2 - June 22, 2022

### Improvements

-   Add the ability add contacts to contact groups in bulk
-   Add a Quick action menu when right-clicking on an email
-   Add the ability to insert a link on images in the composer

### Bug fixes

-   Fix an issue where downloading a single attachment would create a zip file
-   Fix an issue where a placeholder was briefly shown when accessing a folder known to be empty
-   Fix an issue where an incorrect font would be displayed in the composer
-   Fix an issue with composer keyboard shortcuts

## Release 5.0.1 - May 27, 2022

-   Add V4 classic theme

# Introducing Proton's refreshed look.

## Release: 5.0.0 — May 25, 2022

As we continue to make privacy accessible to everyone, we've updated our apps to provide you with an even better experience with our services.

Proton - Privacy by default.

## Release 4.0.20 - Apr 27, 2022

### Improvements

-   Updated the UI of the main search bar
-   Updated the UI of specific modals
-   Added the option to edit expiration time from the expiration banner inside the composer directly

### Bug fixes

-   Fixed an issue where the "Try again" option on messages with decryption error would not behave correctly
-   Fixed an issue where pasting content with <> brackets inside the composer would not behave correctly
-   Fixed some minor display & alignment issues

## Release 4.0.19 - Apr 06, 2022

### Improvements

-   Updated the UI of specific modals
-   Improved copying behavior for senders and recipients within the message view

### Bug fixes

-   Fixed an issue where the print preview would not include the list of email attachments
-   Fixed an issue where on some rare occasions, embedded images would not be displayed even though they are mentioned in the attachment list (only for PGP-encrypted messages)
-   Fixed an issue where pressing "Enter" after typing a contact name within the contact group modal would submit the form instead of selecting the contact name from the autocomplete list
-   Fixed an issue where after pasting particular html attributes in the composer would the pasted attributes would appear ignored
-   Fixed an issue where vertical space between the message body and the signature would be missing in the composer after switching to plain text within the composer
-   Fixed an issue where some empty placeholders would be displayed if viewing a message as HTML
-   Fixed an issue where pasting content from Microsoft Office (including Excel) would result in pasting an inline image
-   Fixed an issue where a "Remote content could not be downloaded" message would be displayed for remote images, where the URL is encoded twice

## Release 4.0.18 - Mar 23, 2022

### Improvements

-   Updated the UI of the main message view
-   Updated the UI of specific modals
-   Improved app loading times by caching specific assets offline

### Bug fixes

-   Fixed an issue where a wrong font would be displayed for a draft if it is created from the mobile app
-   Fixed an issue where embedded images were received non-embedded in replies sent through the Encryption for non-ProtonMail users tool
-   Fixed an issue where sending of a message using the Encryption for non-ProtonMail users tool was not possible if adding a high number of attachments
-   Fixed an issue where the focus was not initially in the "To" field when forwarding or replying to a message
-   Various accessibility fixes

## Release 4.0.17 - Mar 9, 2022

### Improvements

-   Adjusted the email tracker count to only count tracker within the present message, excluding previous messages within a conversation. Tracker protection still applies to the entire conversation.
-   Moved the "Daily email notifications" setting to the "General" section in Settings

### Bug fixes

-   Fixed an issue where empty lines would be added at the beginning of a new message in plain text mode if a signature is present
-   Fixed an issue where some images in newsletters would be displayed incorrectly if the height has been set as a percentage by the sender
-   Fixed an issue where a "Message processing error" would occur for some very old messages in an account
-   Fixed a sidebar display issue for labels with longer names
-   Fixed an issue where mailto: links containing more than one email address were not handled correctly if using the Firefox browser

## Release 4.0.16 - Feb 16, 2022

### Improvements

-   The underlying technology of the content editor inside the composer has been completely reworked
-   Added the ability to export a single contact group from the contact group view

### Bug fixes

-   Fixed an issue where particular pieces of text would not be displayed in forwarded messages if inserted after a certain sequence of characters (e.g. three dashes in a row)
-   Fixed an issue where under rare circumstances, some messages would not load on the right side when in column layout
-   Fixed an issue where sometimes the cursor would jump back to the beginning of the text already typed when inside the composer
-   Fixed an issue where the '-' character would not be displayed correctly in the "Original message" separator within a forwarded/replied to email
-   Fixed an issue where inline images would sometimes not load immediately when replying to a forwarded message and open the newly sent message right away
-   Fixed an issue where a "The address might be misspelled" error message would display for valid email addresses in the composer
-   Fixed an issue where a "URL is not valid" error would appear for particular remote images in some newsletters
-   Fixed an issue where the "Show original message" keyboard shortcut would not be responsive in forwarded/replied to messages
-   Various localization and translation fixes

## Release 4.0.15 - Feb 2, 2022

### Improvements

-   Reworked the underlying technology of the Encrypted to Outside functionality that allows sending messages to external recipients with end-to-end encryption
-   Drafts containing an invalid sender will now revert to the default sending address with an informational message when opening them
-   Improved speed of loading the composer when undoing sending of a message

### Bug fixes

-   Fixed an issue where a message update made from mobile would not immediately be displayed on the web version
-   Fixed an issue where contacts with commas in Addresses could not be saved
-   Fixed an issue where in Row layout, opening an email and then navigating back to the list would result in the last position not being retained
-   Fixed an issue where the characters in the "Original message" heading would not be displayed correctly when replying to an email on accounts where no signature is set
-   Fixed an issue where the Plus plan was not mentioned as a paid plan in the conditions for the auto-reply functionality

## Release 4.0.14 - Jan 19, 2022

### Improvements

-   Improved the underlying technology responsible for the message view display
-   Added reasoning for unallowed message move actions into the existing error message
-   Added the ability to filter by Addresses in the advanced search widget
-   Added a special icon for contact details where the digital signature could be verified

### Bug fixes

-   Fixed an issue where when resizing the browser window in column layout, the proportion between the list view and the message view would resize unintentionally
-   Fixed an issue where when the "Search message content" option is activated and a search is performed, switching between folders/location would not succeed until a full page reload
-   Fixed an issue where it was possible to activate the Sticky Labels option despite the Conversation mode being disabled
-   Fixed an issue where Anniversary and Birthday dates might be imported incorrectly if the respective values are not formatted as dates
-   Fixed an issue where the "Clear" option in advanced search would not clear certain field inputs
-   Fixed an issue where sending a message would fail if uploading an attachment and changing the sender very quickly after
-   Fixed an issue where contact groups would not be displayed correctly in the "Insert contact" modal
-   Fixed an issue where a contact could not be imported correctly if the name is separated by a comma
-   Fixed an issue where the ellipsis would be displayed wrongly for long attachment names in the message view

## Release 4.0.13 - Dec 22, 2021

### Improvements

-   Added more technical improvements related to the State Management of the application
-   Updated the wording of the modal appearing when a deleting folder to indicate that sub-folders will be deleted as part of the process
-   Improved the look and feel of the composer loading state in dark mode

### Bug fixes

-   Fixed an issue where in search results, navigating between single messages that belong to the same conversation would not be possible
-   Fixed an issue where the composer would show in expanded mode even though the setting is set to be "Default mode"
-   Fixed an issue where when pasting external content, only the first row would adhere to the Default font setting
-   Fixed an issue where some specific imported contacts could not be loaded through the UI
-   Fixed an issue where when merging contacts with emails that belong to the same group, unrelated groups appear on the merge preview modal
-   Fixed various translation issues

## Release 4.0.12 - Dec 8, 2021

### Improvements

-   Updated the User Interface of the composer
-   Added support for images loaded via CSS style attributes
-   Added the ability to jump to My addresses directly from the composer "To" field
-   Added the ability to prompt the default handler browser setting from the UI for Firefox users, eliminating the prompt on each page load
-   Added the ability to change the default font from the Mail interface without the need to navigate to Settings
-   Added automatic calendar creation for cases when an invite is received but no calendar exists yet
-   Various minor UI improvements

### Bug fixes

-   Fixed an issue where some base64-encoded message bodies would not be displayed correctly
-   Fixed an issue where on rare occasions, attachments in external PGP-encrypted messages would only display on page reload
-   Fixed an issue where the contacts widget would flash rapidly for some particular screen resolutions

## Release 4.0.11 - Nov 24, 2021

### Improvements

-   Improved the error management when trying to view a contact with corrupted data inside
-   Added some technical improvements related to the State Management of the application
-   Minor UI improvements and enhancements

### Bug fixes

-   Fixed an issue where sending external, signed, non-encrypted messages would time out due to the message size
-   Fixed an issue where the width of the advanced search widget would vary depending on the options chosen
-   Fixed an issue where some attachment file icons would not be displayed properly
-   Fixed an issue where the sent icon would be missing in header details if the setting "Keep messages in Sent/Drafts" was enabled
-   Fixed an issue where mailto: links were considered as links if the mail contains a <base> tag
-   Fixed an issue where it was possible to use the Space key to invisibly select a conversation in Row layout
-   Fixed an issue where the file preview would not be full screen if clicked on a file from inside the composer

## Release 4.0.10 - Nov 10, 2021

### Improvements

-   Added the contact import functionality to the Mail Settings "Import/Export" page
-   Added a warning for keys that are considered less secure in Settings
-   Added an option to filter locations in the advanced search widget
-   Improved the autocomplete functionality that displays when adding contacts to a group to display most frequently used contacts first
-   Added file preview support for videos up to 100MB
-   Added icons for additional attachment file types
-   Clicking on the attachment icon in the expanded message view redirects to the attachment list
-   Removed the success banner when marking messages as read/unread

### Bug fixes

-   Fixed an issue where if two attachments had the same name, both attachments would be removed if attempting to remove one inside the composer
-   Fixed an issue where for emails with certain styles, the styles would be displayed outside of the email boundaries
-   Fixed an issue where particular HTML content would look broken if pasted from an external source and saved as a draft
-   Fixed an issue where the wrong conversation would be opened if pressing "Enter" after archiving something
-   Fixed an issue where importing a contacts csv file from Google would fail if the file contains multiple addresses of the same type
-   Fixed an issue where base tag support would not work properly in some cases
-   Fixed an issue where after moving several messages to Trash one by one, the whole conversation would appear as moved to Trash for a short moment
-   Fixed an issue where under certain circumstances a "Sending..." banner would be displayed in addition to a failure banner if a message actually failed to be sent
-   Fixed an issue where some dropdown elements would stay on the screen when scrolling
-   Fixed an issue where the "Delete" option would not display if adding a search location with a lot of characters
-   Updated "Inline PGP" wording to be "PGP/Inline" in contacts

## Release 4.0.9 - Oct 27, 2021

### Improvements

-   The composer window can now be moved horizontally allowing to customize the writing experience even further
-   In column layout, the message view can now be resized by dragging the vertical separator between the list view and the message view
-   Updated the UX of the location field inside the advanced search
-   Improved focus management by placing the autofocus on the attachment popup when adding an attachment to the composer
-   Improved the search mechanism by defaulting to the current location when opening advanced search
-   Updated the icon for "Encryption & keys" in settings to match the encryption icon in the message view
-   Improved the underlying technology for undoing various actions, like sending and moving messages
-   Implemented various performance improvements to speed up loading times, including but not limited to: composer, sidebar, drag&drop elements, focus management and pagination
-   Updated the design of email calendar invitations

### Bug fixes

-   Fixed an issue where sending large attachments with non-Latin file names would cause a sending problem
-   Fixed an issue where a wrong error message would be displayed if the sending limit has been reached
-   Fixed an issue where the last day was excluded in search results if defining a specific date range in advanced search
-   Fixed an issue where adding an image URL with extra URL parameters in contacts would show a broken image
-   Fixed an issue where embedded images would not display correctly for some seconds while the message is in "Sending" state
-   Fixed an issue where the "Drag&Drop" area would be activated too late when dragging attachments into the composer from particular directions
-   Fixed an issue where if clicking into the composer body first, it would require two clicks to open the "CC/BCC" fields
-   Fixed an issue where when moving messages from the Spam folder, the "Undo" action would sometimes not appear in the success notification
-   Fixed an issue where moving a labelled message to Trash and undoing the action would result in missing labels
-   Renamed all "X25519" key references to "Curve25519"

## Release 4.0.8 - Oct 13, 2021

### Improvements

-   Updated the UX of the advanced search widget
-   Added the ability to navigate the contact widget using the keyboard
-   Added the ability to jump to the attachment list by clicking on the attachment icon in the header of an email
-   Added support for internal links inside messages

### Bug fixes

-   Fixed a rare issue where under certain circumstances attachments would not be displayed in PGP-encrypted messages that are forwarded
-   Fixed an issue where an additional draft would be visible for a short amount of time for messages already sent
-   Fixed an issue where embedded images would sometimes not be displayed correctly in a sent email if the email has been sent before their upload has finished
-   Fixed an issue where sometimes a "Conversation does not exist" error message would be displayed if clicking on a browser notification informing about new messages
-   Fixed various minor localization and translation issues

## Release 4.0.7 - Sep 29, 2021

### Improvements

-   Added the option to set a default font for composing new messages.
-   Added a reminder after a password reset, that decryption keys need to be re-activated to read old email messages.
-   Saving drafts now also saves message expiration settings which were added to the draft.
-   Added more information in the mail settings UI: for encryption keys which have subkey(s) of a different key type(s) than the primary key, the subkey type(s) will also be displayed.
-   Improved keyboard shortcuts when navigating interfaces to pick a date and when editing contacts.
-   Improved the error messages and instructions when sending a message to a recipient, whose encryption key is invalid.
-   Improved the error message when trying to include an image to the auto reply option, while configuring an automated filter.

### Bug fixes

-   Fixed a rare bug which prevented replying to messages with attachments, when the encryption settings (i.e PGP-inline & sign messages) changed since receiving the message.
-   Fixed a rare bug which can cause the read/unread filter to automatically be applied to search results
-   Fixed an issue where imported contacts with unexpected characters (\n) would not be usable or exportable
-   Fixed an issue where the location of Sent/Draft messages would not be shown in the Sent/Draft folder, the "Keep messages in Sent/Draft" setting is enabled.
-   Fixed an issue where navigating to a folder/label after an advanced searching in said location would not behave as expected

## Release 4.0.6 - Sep 15, 2021

### Improvements

-   Search results now highlight matching keywords to make results easier and faster to read
-   Added the ability to copy the primary email address right from the contact widget
-   Attachment reminder - added support for Italian, Portuguese, Dutch and Polish
-   Added an informational message for cases where an image cannot be loaded due to it's hosting on http as opposed to https
-   Improved the search algorithm to include contacts in the "CC" and "BCC" fields when searching inside the "To" field
-   Placed the cursor auto-focus on the URL field when adding images or links from the composer

### Bug fixes

-   Fixed an issue where emails using special styles would be displayed with a message "Can't load styles"
-   Fixed an issue where an empty inbox would be displayed if quickly moving a large number of messages to another location several times
-   Fixed an issue where it was not possible to open contact settings when a contact email address was very long
-   Fixed an issue where the message selection would be reset if marking emails as unread and read quickly one after another
-   Adjusted styling for the banner displayed on emails where an expiration date is set
-   Fixed an issue where images in particular newsletters would appear either too big or too small
-   Fixed an issue where "Composer size" would be referred to as "Composer mode" in the top navigation bar quick settings

## Release 4.0.5 - Sep 1, 2021

### Improvements

-   Improved handling of drafts that have been sent from other clients
-   When clicking on the Refresh icon next to a location in the sidebar, filters are now preserved
-   Added a clearer notification text when a message is marked as not spam
-   Added autofocus to the name field of the modals used for creating folders and labels

### Bug fixes

-   Fixed an issue where an unnecessary character would be added at the end of a link confirmation URL
-   Fixed an issue where a request timeout would prevent a message with bigger attachments from sending
-   Fixed an issue where Shift+Click for selecting multiple items in a list would not work in compact density mode on Firefox
-   Fixed an issue where the subject and the body would not be populated when using a mailto: link in Firefox
-   Fixed an issue where conversation ordering was incorrect if several conversations have the exact same timestamp
-   Fixed an issue where on very rare occasions a negative attachments counter would be displayed

## Release 4.0.4 - Aug 18, 2021

### Improvements

-   ProtonMail as your default mail handler - set up your browser to open a new ProtonMail composer each time you click onto a mailto: link. Latest versions of Chrome, Brave, Firefox, Opera and Edge are supported.
-   Attachment reminder - ProtonMail will now remind you to add attachments if certain keywords are detected in your draft. Keyword detection respects your privacy and happens locally in the browser.
-   Improved the message expiration date experience by setting the default expiration period to 7 days
-   Marking a single message within a conversation as unread will now keep the conversation in question open
-   Use keyboard shortcuts in autocomplete suggestions (for example, "Enter" to select and "Esc" to cancel recipient suggestions in the composer)
-   Updated welcome banner messaging for free accounts
-   Contacts import - improved handling of some existing contact fields (Organization, Member, Gender, Language, Timezone, Country) and other fields that are not supported by Proton Contacts
-   Placed the autofocus on the name field when adding new or editing existing contacts

### Bug fixes

-   Fixed an issue where a Draft uploaded from a mobile client would only show on the Web version after a page refresh
-   Fixed wrong wording for the "Delete all" confirmation modals
-   Fixed an issue where an auto-reply end date that is before the start date could be entered
-   Fixed an issue where a newly added remote image would not be displayed in signatures under certain circumstances
-   Fixed an issue where reordering labels using drag&drop was too slow if having a big amount of labels
-   Fixed an issue where a dropdown field would sometimes disappear on the contacts import matching screen
-   Fixed an issue where the contact name would not be displayed if adding a new group while creating a new contact

## Release 4.0.3 — July 28, 2021

### Improvements

-   Added the ability to add an email address to a group directly during the contact creation process
-   Improved the error message shown when the maximum number of composers is reached
-   Improved the warning shown when trying to send to invalid recipients
-   Added the ability to add events that do not require a response to calendar

### Bug fixes

-   Fixed an issue where in some rare cases the message list view would not load
-   Fixed an issue where copy & pasted content in signatures would be sent incorrectly
-   Fixed an issue where an embedded image from a draft could not be removed on reopening
-   Fixed an issue where on rare occasions an embedded image would not be sent when deleting and undoing the delete action immediately
-   Fixed an issue where merging contacts could not proceed if all contacts are marked for deletion
-   Fixed an issue where custom field headings would be replaced by "Other" headings on contact import
-   Fixed an issue where the confirmation modal would display "Delete conversation" when deleting a single message
-   Fixed an issue where contacts containing specific characters could not be merged
-   Fixed an issue where incorrect attachment icons would be displayed for key, .zip and .ics files
-   Fixed an issue where duplicated recipients in the CC field could not be deleted if typing their email addresses manually beforehand
-   Fixed an issue where folder names would disappear when dragging something into them on light themes
-   Fixed an issue where a contact image would not be displayed if editing a contact just after adding it

## Release: 4.0.2 — July 14, 2021

### Improvements

-   Removed automatic domain suggestions in the autocomplete dropdown in the composer so that only saved contacts are now appearing as suggestions
-   Added the ability to change the mailbox layout, density and composer mode from the top navigation bar ("Settings" menu)
-   Updated attachment icons
-   Improved the display of remote and embedded images that are not loaded inside an email
-   Improved the messaging for cases where remote content cannot be loaded due to a certificate validity issue on sender's side
-   Improved error messaging for cases when a key associated with a calendar is deleted
-   Improved error messaging for cases where too many search results are found and the search needs to be further limited
-   Added headings to the Contacts widget to improve accessibility
-   Removed icons indicating Sent and Draft messages inside the Sent and Draft locations

### Bug fixes

-   Fixed an issue where the message format would be broken if changing from HTML to default composer mode back and forth several times
-   Fixed an issue where in some cases, embedded images would not be removed if deleting respective placeholders when forwarding an email
-   Fixed an issue where the translated version of a folder title would not be displayed inside the browser tab page title
-   Fixed an issue where an English version of a confirmation modal would be displayed for non-English versions

## Release: 4.0.1 — June 16, 2021

### Improvements

-   Added support for keyboard shortcuts inside dropdown menus
-   Improved and accelerated the loading of messages in the list view
-   Improved loading times of the composer when replying to/forwarding a message with a lot of attachments
-   Added a retry mechanism in cases where a message fails to load due to network issues
-   Added an inactive state to the composer if the focus is somewhere else
-   Improved contact search by adding diacritics support
-   Improved the way the focus returns to the previous element after closing the composer

### Bug fixes

-   Fixed an issue where the focus would be lost after taking action on messages in the list view using keyboard shortcuts
-   Fixed an issue where the contact widget would not be fully displayed for some screen resolutions
-   Fixed an issue where exporting a message containing an attachment with a decryption error would fail
-   Fixed an issue where the contact encryption status would not be updated if changing the status while the composer is open
-   Fixed an issue where contacts in a particular format could not be merged
-   Fixed an issue where images inserted from an external URL would not be displayed
-   Fixed an issue where a single message would be auto-focused when selecting a conversation in row layout
-   Fixed an issue where an update would not be visible on the web client if previously updated from a mobile client
-   Fixed an issue where an error message would be displayed when deleting messages on the last folder page
-   Fixed an issue where addresses in contacts would be displayed without line breaks
-   Fixed an issue where the specific folders icons were missing inside the "Move to" menu
-   Fixed an issue where the focus would disappear from the conversation if navigating to a draft message inside
-   Fixed an issue where the formatting option selected would not be highlighted in the composer toolbar
-   Fixed an issue where the "Trust key" banner would be displayed even if the key was already trusted
-   Fixed an issue where the notification option would appear disabled for folders created using the "Move to" menu in the navigation bar
-   Fixed an issue where the "Unread" filter would disappear in the responsive view
-   Fixed an issue where messages that were partially hidden below the toolbar could not be selected
-   Fixed an issue where empty groups would be suggested in the composer autocomplete element
-   Fixed an issue where selecting a date field in contacts and then changing the selection would result in the value being displayed incorrectly
-   Fixed an issue where on some occasions the Unsubscribe URL would be shown twice in the Unsubscribe confirmation modal

# Introducing the new ProtonMail!

## Release: 4.0.0 — June 8, 2021

Fully revamped, the latest version of ProtonMail has a modern design, more customization options, and improved usability. This means keeping your data private is even easier and more enjoyable. [Learn more about this release](https://protonmail.com/blog/new-protonmail-announcement).

### New features

-   **New design**: Clean layout and modern design provide a fresh look and better experience.
-   **Themes and layouts**: Customize your inbox with new themes, such as dark mode, and various layouts.
-   **Subfolders**: Manage your emails by people, topics, projects, etc.
-   **Preview attachments**: Preview PDF and image attachments before you open them. It's faster and more secure.
-   **Undo send**: Sent an email by mistake? Undo send with a single click right after the email goes out.
-   **App selector**: Quickly select and switch between different Proton services (Mail, Calendar, Drive, VPN).
-   **Persistent session**: Stay signed in without losing your user session, even after closing your browser.
-   **Calendar integration**: RSVP to calendar invitations directly from an email.
-   **Encrypted address book**: Securely store your contacts’ details.

### Improvements

-   **Quick filters**: Makes sorting and finding messages faster and easier.
-   **Keyboard shortcuts**: We have redesigned shortcuts so you can navigate your inbox and take action on messages with increased ease. Type "?" to view the shortcuts.
-   **Load time**: Faster load times for improved performance.
-   **Usability enhancements**: Create folders and labels from the sidebar and access contacts directly from the top navigation bar.
-   **Accessibility**: Improved contrast and screen reader friendliness make privacy truly accessible to all.

Thank you to our beta users for making ProtonMail the best secure email service available! We welcome your continued feedback on our current release. You can also report an issue or request a feature under "Help" in the top menu bar.

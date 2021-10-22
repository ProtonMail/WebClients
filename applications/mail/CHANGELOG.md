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

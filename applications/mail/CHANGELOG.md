[4.0.0 - Beta 35] - 2021-01-21

## New features

-   Keyboard shortcuts are finally back, for faster inbox processing
-   Go to Settings > General > Keyboard shortcuts to turn them on
-   Hit ? at any point in time to view the list of applicable shortcuts

## Improvements

-   Improved the keyboard navigation using arrows
-   Improved the actions based on the areas where the focus is put on
-   Improved the way to resume the focus by hitting the Tab key
-   Improved the tab navigation (within a modal, within a dropdown, within the composer)
-   Added shortcut information in tooltips when shortcuts are active
-   Added a welcome modal on the Import/Export page in settings
-   Added the support for default system sub-folders when importing messages using the import assistant
-   Improved the process to unsubscribe from newsletters depending on the method supported by the sender

## Fixes

-   Fixed an issue whereby the view profile option would not work after trusting the new key
-   Fixed an issue whereby the banner would not be removed after trusting the new key

# [4.0.0 - Beta 34] - 2021-01-13

## Improvements

-   Undo send is available to free users
-   User is able to set the undo send delay to 5, 10 or 20 seconds
-   Improved filter creation flow
-   Various UX and UI improvements to the import assistant
-   Various improvements to better support localization / translation
-   UI improvements to the recipient's list in the composer

## Fixes

-   Fixed an issue whereby in some case sending a message would trigger a chain of "too many API requests" errors
-   Fixed some issues related to the file preview not working at all or displaying only a minimized version of the file
-   Fixed an issue whereby unselecting all contacts from a group will freeze the application
-   Fixed some issues related to pasting content in the composers
-   Fixed an issue whereby in some cases undoing a move would not work
-   Fixed a bug whereby default auto-reply would not be saved in some cases

# [4.0.0 - Beta 33] - 2020-12-16

## New features

-   Premium users can delay the message sending by 5 seconds (to activate this feature go to Settings > General > Messages)
-   All users can preview PDF files and images locally within the Protonmail Web App

## Improvements

-   The opened conversation/message stays opened while navigating through pages of the same folder
-   Improved performance and memory consumption on all browsers, especially Chrome
-   Improved mouse and keyboard interactions when composing a new message
-   Improved localization strings for easier translation
-   Accessibility and vocalization improvements

## Various UI/UX improvements Fixes

-   Fixed an issue whereby switching from plain text to HTML would wipe the message content out
-   Fixed an issue whereby sometimes copy/pasting content inside the composer would not properly format the pasted content
-   Various small bug fixes

# [4.0.0 - Beta 32] - 2020-12-08

## Improvements

-   Improved transition between settings and the mail application by merging both projects
-   Improved the processing of encryption keys when changing the email address the user wants to send the message from
-   Better handling of searching/filtering queries and matching results
-   Updated the list of suggestion when auto-completing an email address input
-   Vocalization improvements
-   Various UI/UX improvements

## Fixes

-   Fixed a few key-related issues that sometimes would lead to an "invalid packet address" error message
-   Fixed an issue whereby the selection of multiple labels would make the focus jump to the top of the labels list
-   Fixed an issue that made it difficult for users to apply a label to all the messages inside a conversation if one message was already tagged with that label
-   Fixed a few issues when replying to messages sent to an alias that contains the "+" character
-   Fixed an issue that broke searching on mobile devices
-   Fixed a bug that removed the navigation bar when viewing the settings from a mobile device

# [4.0.0 - Beta 31] - 2020-11-18

## New feature

-   Making the Import Assistant feature available to all users, including users on the Free subscription plan.
-   Import Assistant is a tool that allows user to connect to an external email provider and import selected messages and folders. [Learn More](https://protonmail.com/support/knowledge-base/import-assistant).

## Improvements

-   Improved the way we deal with the original message when switching between rich text and plain text mode
-   Updated the content of the Import Assistant page

## Fixes

-   An error sometimes appeared when sending a message after changing the "from" address
-   Fixed an issue that made the error message disappear upon submitting a wrong port number during the import process
-   Fixed an issue whereby when saving the name of a folder during the import process, other names being edited would also get saved

# [4.0.0 - Beta 30] - 2020-11-12

## New features

-   Allow the user to respond to an invitation from the event's widget
-   Allow the user to see the response to an invitation
-   Allow the user to update the response to an invitation

## Improvements

-   Visual improvements to the pagination component
-   Pagination component is not visible when there is only one page
-   Improved warning when leaving a flow without saving changes
-   Improved handling of member permissions when accessing restricted areas

## Fixes

-   After replying to a message not located on the first page of a folder, the user would be redirected to the first page
-   The "Trust public key" options was missing in the sender's dropdown
-   The "Trust new key" modal could sometimes get stuck
-   Message cache would not get updated after a new key is trusted

# [4.0.0 - Beta 29] - 2020-11-04

## New features

-   At the bottom of the message list view, a navigation widget is displayed to help browse through pages of messages

## Improvements

-   Moved the "show original message" button higher up in the composer when replying to a message or forwarding a message
-   Improved the way we identify email addresses when pasting a list of addresses separated by a comma or a semicolon
-   Added tooltips to reply, reply all and forward icons
-   Updated the phishing detection warning banner to make the action clearer
-   Improved the "mark as spam" and "not a spam" actions
-   Improved the list and the message layouts to account for small screen layouts
-   Various visual elements updated to increase readability of messages
-   Added a more descriptive error message when failing to authenticate to another email service provider while using the import assistant

## Fixes

-   When a message gets exported, the message's remote content loaded, which could present a security vulnerability
-   Sometimes, the "failed domain authentication" banner would disappear after a short moment
-   In some cases, deleting permanently a sent email by clicking on the button in the tool bar did not work
-   Sometimes, the error "Error while sending the message. Message is not sent." would appear
-   When emptying a labels, user would see multiple errors stacked that read "Conversation does not exist"
-   Various bug fixes related to message signatures and trusted keys

# [4.0.0-beta.28] - 2020-10-22

## Fixes

-   Hot fixing an issue whereby some messages would not decrypt

# [4.0.0-beta.27] - 2020-10-21

## Improvements

-   Various UI/UX improvements Fixes

## Fixes

-   Various bug fixes

# [4.0.0-beta.26] - 2020-10-21

## Improvements

-   Performance improvements when loading the list of conversations
-   Performance improvements when starring a conversation
-   Performance improvements when marking a message as read/unread

## Fixes

-   In some cases, after opening en email that contains a meeting invitation, the widget will continue to appear when opening other emails
-   When receiving a plain text message with the < character in the body of the message, the end of the message would get stripped out

# [4.0.0-beta.25] - 2020-10-14

## New features

-   Import Assistant tool that allows connecting external email provider and imports selected messages and folders (accessible by paid users only). [Learn More](https://protonmail.com/support/knowledge-base/import-assistant).

## Improvements

-   Added a dedicated import/export page (accessible by paid users only)
-   Various UI/UX improvements

## Fixes

-   Various bug fixes

# [4.0.0-beta.24] - 2020-10-07

## New features

-   Added a widget in the email header to display an event's summary when an invitation (ICS file) is attached to a message
-   Various bug fixes on the addresses page
-   Various bug fixes on the filter page

## Improvements

-   Show the recipients' information instead of the sender's information when viewing the drafts folder
-   Remember the collapsed state of folders and labels section in the menu
-   Reworked the apps page to focus on mobile applications
-   Moved the IMAP/SMTP content to a dedicated page for better visibility

## Fixes

-   Sometimes the original message would not load in the composer when replying to or forwarding that message
-   The original message would not get sent when replying to or forwarding that message

# [4.0.0-beta.23] - 2020-09-30

## New features

-   Folders/labels: separation of folders and labels tables
-   Folders/labels: support for sub-folders added (up to 3 levels)
-   Appearance: support for view density (compact, comfortable)

## Improvements

-   Updated overview page
-   Updated page layout
-   Improved filter flow experience
-   Content limited to mail-related settings
-   Account-related settings moved to Proton Account

## Fixes

-   Minor UI/UX bug fixes following the deployment of the new Protonmail app
-   Various bug fixes

# [4.0.0-beta.22] - 2020-09-30

## New features

-   Support for sub-folders
-   Support for compact and comfortable lists
-   Drag-and-drop of email addresses between To, CC and BCC, and from one composer to another
-   Right click on email addresses in the composer to access a context menu

## Improvements

-   Increased app performance
-   Folders and labels split in the menu
-   Visual animation when loading content on screen
-   Accessibility improvements
-   Various UX / UI improvements

## Fixes

-   Various bug fixes

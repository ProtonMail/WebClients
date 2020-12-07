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

## Improvements

-   Improved the way we deal with the original message when switching between rich text and plain text mode

## Fixes

-   An error sometimes appeared when sending a message after changing the "from" address

# [4.0.0 - Beta 30] - 2020-11-12

## New features

-   allow the user to respond to an invitation from the event's widget
-   allow the user to see the response to an invitation
-   allow the user to update the response to an invitation

## Improvements

-   Visual improvements to the pagination component
-   Pagination component is not visible when there is only one page

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

## Improvements

-   Various UI/UX improvements

## Fixes

-   Various bug fixes

---

# [4.0.0-beta.24] - 2020-10-07

## New features

-   Added a widget in the email header to display an event's summary when an invitation (ICS file) is attached to a message

## Improvements

-   Show the recipients' information instead of the sender's information when viewing the drafts folder
-   Remember the collapsed state of folders and labels section in the menu

## Fixes

-   Sometimes the original message would not load in the composer when replying to or forwarding that message
-   The original message would not get sent when replying to or forwarding that message

---

# [4.0.0-beta.23] - 2020-09-30

## Fixes

-   Minor UI/UX bug fixes following the deployment of the new Protonmail app

---

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

This folder contains the Redux logic to operate primary actions on messages and conversations. These actions act on multiple elements (slices) at once:

- `messages`
- `conversations`
- `elements`
- `messageCounts`
- `conversationCounts`

Actions supported:

- [x] Mark messages as read.
- [x] Mark messages as unread.
- [x] Mark conversations as read.
- [x] Mark conversations as unread.
- [ ] Apply/remove labels to messages.
- [ ] Apply/remove labels to conversations.
- [ ] Permanently delete messages.
- [ ] Permanently delete conversations.
- [ ] Empty label.
- [ ] Snooze/unsnooze message.
- [ ] Snooze/unsnooze conversation.

# Acceptance criteria

## Mark messages as read

When a user marks an unread message as read, the following should happen:

- The message should be marked as read.
- The conversation should be updated to reflect the new number of unread messages.
- The conversation should be marked as read if its unread count was 1.
- The unread message counts should decrease in all locations the message is present.

## Mark messages as unread

When a user marks a read message as unread, the following should happen:

- The message should be marked as unread.
- The conversation should be updated to reflect the new number of unread messages.
- The conversation should be marked as unread if its unread count was 0.
- The unread message counts should increase in all locations the message is present.

## Mark conversation as read

When a user marks an unread conversation as read, the following should happen:

- The conversation should be marked as read.
- All messages attached to the conversation should be marked as read.
- The unread conversation counts should be decremented by 1 in all locations the conversation was marked as unread.

## Mark conversation as unread

When a user marks a read conversation as unread, the following should happen:

- The conversation should be marked as unread.
- The last message of the current location attached to the conversation should be marked as unread.
- The unread conversation counts should be incremented by 1 in the location where the conversation was marked as read. Other locations are for now inpredictable with the partial data the client has today.

## Label a message

When a user is applying a label to a message, the new label should be applied to the message. Additionally, depending on the target destination type, extra rules needs to be applied.

### Target destination is a system folder or a custom folder

On top of adding the new label to the message labels, extra rules should be applied:

- When the message will be moved out from TRASH or SPAM, the auto-delete expiration should be removed.
- If the target destination is TRASH or SPAM:
    - The message should be removed from STARRED.
    - The message should be removed from ALMOST_ALL_MAIL.
    - The message should be removed from all custom labels.
    - If the destination is TRASH, the message should be marked as read.

### Target destination is a category

The previous category should be replaced by the new one.

### Target destination is a system label or a custom label

No additional rules. The new label should simply be added to the message.

## Unlabel a message

When a user is removing a label from a message, performing the action should be only possible with custom labels, so we are simply removing the label from the message labels.

## Move conversation

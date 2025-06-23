import { useEffect, useMemo, useState } from 'react';

import { SECOND } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isReceived } from '@proton/shared/lib/mail/messages';

import { isUnreadMessage } from 'proton-mail/helpers/elements';

/**
 * Hook used to determine if we need to display the "X new unread messages" in the conversation view,
 * which is a notification we display when we receive new incoming message while consulting a conversation
 */
const useUnreadNotifications = (messages: Message[], conversationID: string) => {
    // We are using a time marker to determine if we need to display unread notification or not.
    // When opening the conversation, we set the timer to the current date.
    // All new messages will be detected as new unread, and we will be able to display a notification.
    // When reading a message we will move the time marker so that we display notifications for newer messages.
    const [timeMarker, setTimeMarker] = useState(Date.now() / SECOND);

    // We want to show the notification for messages that have been received after the current time marker
    const unreadMessageAfterTimeMarkerIds = useMemo(() => {
        const filteredMessages = messages.filter(
            (message) => (message.Time || 0) > timeMarker && isReceived(message) && isUnreadMessage(message)
        );
        return filteredMessages.map((message) => message.ID);
    }, [messages]);

    // When reading a message, we can increase the time marker
    const handleReadMessage = (messageID?: string) => {
        // We want to set the time marker only if higher, otherwise, marking as read an older message would decrease
        // the time marker (and potentially we would have to display more notifications)
        const messageTime = messages.find((message) => message.ID === messageID)?.Time;
        if (messageTime && messageTime > timeMarker) {
            setTimeMarker(messageTime);
        }
    };

    // Update the time marker when the conversation is updated
    useEffect(() => {
        setTimeMarker(Date.now() / SECOND);
    }, [conversationID]);

    return { unreadMessageAfterTimeMarkerIds, handleReadMessage };
};

export default useUnreadNotifications;

import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

/**
 * Derive a display sender string from a message. Falls back to the address when
 * no name is present, and omits the sender entirely when there is no address.
 * Only first-party metadata is used; no decrypted body content is touched.
 */
export const getSenderFromMessage = (message?: Pick<Message, 'Sender'>) => {
    const sender = message?.Sender;
    if (!sender?.Address) {
        return undefined;
    }
    return sender.Name || sender.Address;
};

/**
 * Build the minimal payload sent to Calendar to initialise the event editor.
 * Only `messageID`, `subject` and optionally `sender` are forwarded - never the
 * message body. `start` is the drop target timestamp (set for drag & drop,
 * undefined for the "Add to Calendar" menu action which uses Calendar defaults).
 */
export const getCreateEventFromMessagePayload = (message?: Pick<Message, 'ID' | 'Subject' | 'Sender'>, start?: number) => {
    if (!message) {
        return undefined;
    }

    return {
        messageID: message.ID,
        subject: message.Subject || '',
        sender: getSenderFromMessage(message),
        start,
    };
};

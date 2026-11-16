import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import type { BatchMessage, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

export function buildMessageMetadata(overrides: Partial<MessageMetadata> = {}): MessageMetadata {
    return {
        ID: 'message-1',
        Order: 1,
        ConversationID: 'conversation-1',
        Subject: 'Subject',
        Unread: 0,
        Sender: { Name: 'Sender', Address: 'sender@proton.me' },
        ToList: [{ Name: 'To', Address: 'to@proton.me' }],
        CCList: [],
        BCCList: [],
        Time: 1_700_000_000,
        Size: 1024,
        IsReplied: 0,
        IsRepliedAll: 0,
        IsForwarded: 0,
        AddressID: 'address-1',
        LabelIDs: ['0'],
        ExternalID: 'external-1',
        NumAttachments: 0,
        Flags: 0,
        SnoozeTime: 0,
        DisplaySnoozedReminder: false,
        NewsletterSubscriptionID: null,
        ...overrides,
    };
}

export function buildMessageBatchResponse(
    batchMessageOverrides: Partial<BatchMessage> = {},
    metadataOverrides: Partial<MessageMetadata> = {}
): BatchMessage {
    const metadata = buildMessageMetadata(metadataOverrides);
    return {
        ID: metadata.ID,
        Sender: metadata.Sender,
        ToList: metadata.ToList,
        CCList: metadata.CCList,
        BCCList: metadata.BCCList,
        Time: metadata.Time,
        Size: metadata.Size,
        LabelIDs: metadata.LabelIDs,
        CategoryID: metadata.CategoryID ?? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        ExternalID: metadata.ExternalID,
        NumAttachments: metadata.NumAttachments,
        Unread: Boolean(metadata.Unread),
        MIMEType: MIME_TYPES.DEFAULT,
        Subject: metadata.Subject,
        Body: 'encrypted body',
        ...batchMessageOverrides,
    };
}

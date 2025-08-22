import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation, ConversationLabel } from 'proton-mail/models/conversation';

export const CUSTOM_LABEL_ID1 = 'custom-label-1';
export const CUSTOM_LABEL_ID2 = 'custom-label-2';
export const CUSTOM_FOLDER_ID1 = 'custom-folder-1';
export const CUSTOM_FOLDER_ID2 = 'custom-folder-2';
export const CONVERSATION_ID = 'conversation-1';
export const MESSAGE_ID = 'message-1';

export const customLabels = [
    { ID: CUSTOM_LABEL_ID1, Name: 'Custom Label 1', Type: 1 } as Label,
    { ID: CUSTOM_LABEL_ID2, Name: 'Custom Label 2', Type: 1 } as Label,
];

export const customFolders = [
    { ID: CUSTOM_FOLDER_ID1, Name: 'Custom Folder 1', Type: 1 } as Folder,
    { ID: CUSTOM_FOLDER_ID2, Name: 'Custom Folder 2', Type: 1 } as Folder,
];

export const setupConversation = ({
    conversationID = CONVERSATION_ID,
    conversationLabels,
    numMessages,
    numUnread,
    numAttachments,
}: {
    conversationID?: string;
    conversationLabels: ConversationLabel[];
    numMessages: number;
    numUnread: number;
    numAttachments: number;
}) => {
    return {
        ID: conversationID,
        NumMessages: numMessages,
        NumUnread: numUnread,
        NumAttachments: numAttachments,
        Labels: conversationLabels,
    } as Conversation;
};

export const setupMessage = ({
    messageID,
    unreadState,
    labelIDs,
    attachments,
}: {
    messageID: string;
    unreadState: 'read' | 'unread';
    labelIDs: string[];
    attachments?: Attachment[];
}) => {
    return {
        ID: messageID,
        ConversationID: CONVERSATION_ID,
        LabelIDs: labelIDs,
        Unread: unreadState === 'unread' ? 1 : 0,
        Attachments: attachments || [],
    } as Message;
};

export const setupMessageFromConversation = ({
    messageID,
    unreadState,
    labelIDs,
    flags,
}: {
    messageID: string;
    labelIDs: string[];
    unreadState: 'read' | 'unread';
    flags?: number;
}) => {
    return {
        ID: messageID,
        ConversationID: CONVERSATION_ID,
        LabelIDs: labelIDs,
        Flags: flags || undefined,
        Unread: unreadState === 'unread' ? 1 : 0,
    } as Message;
};

export const expectConversationLabelsSameArray = (array1?: ConversationLabel[], array2?: ConversationLabel[]) => {
    if (!array1 || !array2) {
        throw new Error('Array is undefined');
    }

    const array1Sorted = array1.toSorted((a, b) => a.ID.localeCompare(b.ID));
    const array2Sorted = array2.toSorted((a, b) => a.ID.localeCompare(b.ID));

    expect(array1Sorted).toEqual(array2Sorted);
};

export const expectMessagesLabelsSameArray = (array1?: string[], array2?: string[]) => {
    if (!array1 || !array2) {
        throw new Error('Array is undefined');
    }

    const array1Sorted = array1.sort();
    const array2Sorted = array2.sort();

    expect(array1Sorted).toEqual(array2Sorted);
};

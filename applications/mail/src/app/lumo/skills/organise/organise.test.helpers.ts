import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

/** The store once a later read has reset the list: each conversation survives only in its own slice. */
export const offListState = (conversations: { ID: string }[], viewLabelID: string = MAILBOX_LABEL_IDS.INBOX) => {
    return {
        elements: { elements: {}, params: { labelID: viewLabelID } },
        conversations: Object.fromEntries(
            conversations.map((conversation) => [conversation.ID, { Conversation: conversation }])
        ),
        messages: {},
    };
};

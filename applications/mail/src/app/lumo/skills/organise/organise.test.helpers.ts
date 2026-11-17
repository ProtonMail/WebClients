import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { Element } from '../../../models/element';
import { buildFixedReferences } from '../../helpers/defaultFolders';
import { conversationReferenceFor, messageReferenceFor } from '../../helpers/references';

export const conversationIn = (labelID: string, ID = 'ELEMENT_ID_1') => {
    return { ID, Subject: 'Booking', Labels: [{ ID: labelID }] } as Element;
};

/**
 * The store once a later read has reset the list: each conversation survives only in its own slice.
 * Each needs a `Subject`, or the resolver takes it for the placeholder Mail keeps before a load.
 */
export const offListState = (conversations: { ID: string }[], viewLabelID: string = MAILBOX_LABEL_IDS.INBOX) => {
    return {
        elements: { elements: {}, params: { labelID: viewLabelID } },
        conversations: Object.fromEntries(
            conversations.map((conversation) => [conversation.ID, { Conversation: conversation }])
        ),
        messages: {},
    };
};

/** A `validateMove` whose rules answer every element the same way. */
export const moveRulesAnswering = (answer: 'allowed' | 'denied' | 'notApplicable') => {
    return jest.fn((elements: Element[]) => {
        return {
            allowedElements: answer === 'allowed' ? elements : [],
            deniedElements: answer === 'denied' ? elements : [],
            notApplicableElements: answer === 'notApplicable' ? elements : [],
            errors: [],
        };
    });
};

/**
 * One conversation (from a conversation-view read) and one message (from a search, which lists messages)
 * picked together, as the gym's tidy-inbox task did. Both carry the same `email-` reference shape.
 */
export const mixedSelection = () => {
    const references = createReferenceRegistry(buildFixedReferences());
    const conversation = conversationIn(MAILBOX_LABEL_IDS.INBOX, 'CONVERSATION_ID_1');
    const message = { ID: 'MESSAGE_ID_1', ConversationID: 'CONVERSATION_ID_2', LabelIDs: [MAILBOX_LABEL_IDS.INBOX] };
    const emailReferences = [
        conversationReferenceFor(references, conversation.ID, { title: 'Newsletter' }),
        messageReferenceFor(references, message.ID, { title: 'Receipt' }),
    ];
    const state = {
        elements: {
            elements: { [conversation.ID]: conversation, [message.ID]: message },
            params: { labelID: MAILBOX_LABEL_IDS.INBOX },
        },
        conversations: {},
        messages: {},
    };

    return { references, conversation, message, emailReferences, state };
};

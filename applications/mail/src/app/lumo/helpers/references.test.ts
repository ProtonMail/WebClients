import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { API_CODES, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { Element } from '../../models/element';
import type { ToolStore } from '../toolModule';
import type { ElementFetchDeps } from './references';
import {
    conversationReferenceFor,
    emailReferenceFor,
    isConversationReferenceID,
    messageReferenceFor,
    resolveElements,
    resolveFreshElements,
} from './references';

describe('emailReferenceFor', () => {
    const conversationRow = { ID: 'CONVERSATION_1' } as Element;
    const messageRow = { ID: 'MESSAGE_1', ConversationID: 'CONVERSATION_1' } as Element;

    // Once the email has left every store, this record is the only thing that says which endpoint fetches it.
    it('records a conversation row as a conversation id', () => {
        const references = createReferenceRegistry();

        const reference = emailReferenceFor(references, conversationRow);

        expect(references.idFor(reference)).toBe('CONVERSATION_1');
        expect(isConversationReferenceID(references, 'CONVERSATION_1')).toBe(true);
    });

    it('leaves a message row unrecorded, so it reads as a message id', () => {
        const references = createReferenceRegistry();

        emailReferenceFor(references, messageRow);

        expect(isConversationReferenceID(references, 'MESSAGE_1')).toBe(false);
    });

    it('scopes the record to the registry that minted the reference', () => {
        emailReferenceFor(createReferenceRegistry(), conversationRow);

        expect(isConversationReferenceID(createReferenceRegistry(), 'CONVERSATION_1')).toBe(false);
    });
});

const conversation = { ID: 'CONVERSATION_1', Subject: 'Booking', Labels: [] };
const message = { ID: 'MESSAGE_1', ConversationID: 'CONVERSATION_1', Subject: 'Booking', LabelIDs: [] };

const apiError = (code: API_CODES) => {
    return Object.assign(new Error('api error'), { status: 422, data: { Code: code, Error: 'api error' } });
};

const mailWith = ({
    elements = {},
    conversations = {},
    messages = {},
}: {
    elements?: Record<string, unknown>;
    conversations?: Record<string, unknown>;
    messages?: Record<string, unknown>;
} = {}) => {
    return {
        store: { getState: () => ({ elements: { elements }, conversations, messages }) },
        fetchConversation: jest.fn().mockResolvedValue(conversation),
        fetchMessage: jest.fn().mockResolvedValue(message),
    } as unknown as ElementFetchDeps & { fetchConversation: jest.Mock; fetchMessage: jest.Mock };
};

describe('resolveFreshElements', () => {
    const mintConversation = () => {
        const references = createReferenceRegistry();
        const reference = conversationReferenceFor(references, 'CONVERSATION_1', { title: 'Booking' });
        return { references, reference };
    };

    const mintMessage = () => {
        const references = createReferenceRegistry();
        const reference = messageReferenceFor(references, 'MESSAGE_1');
        return { references, reference };
    };

    it('resolves a reference still in the list to that element, without fetching', async () => {
        const { references, reference } = mintConversation();
        const mail = mailWith({ elements: { CONVERSATION_1: conversation } });

        await expect(resolveFreshElements(mail, [reference], references)).resolves.toEqual([conversation]);
        expect(mail.fetchConversation).not.toHaveBeenCalled();
    });

    // The everyday case: a second search with a different keyword resets the list, but the conversation
    // the first one found is still held, event-updated, in its own slice.
    it('resolves a reference that left the list from the conversations it is still held in', async () => {
        const { references, reference } = mintConversation();
        const mail = mailWith({ conversations: { CONVERSATION_1: { Conversation: conversation } } });

        await expect(resolveFreshElements(mail, [reference], references)).resolves.toEqual([conversation]);
        expect(mail.fetchConversation).not.toHaveBeenCalled();
    });

    it('resolves a message reference that left the list from the messages it is still held in', async () => {
        const { references, reference } = mintMessage();
        const mail = mailWith({ messages: { MESSAGE_1: { localID: 'MESSAGE_1', data: message } } });

        await expect(resolveFreshElements(mail, [reference], references)).resolves.toEqual([message]);
        expect(mail.fetchMessage).not.toHaveBeenCalled();
    });

    it('fetches a conversation reference no slice holds from the conversations endpoint', async () => {
        const { references, reference } = mintConversation();
        const mail = mailWith();

        await expect(resolveFreshElements(mail, [reference], references)).resolves.toEqual([conversation]);
        expect(mail.fetchConversation).toHaveBeenCalledWith('CONVERSATION_1');
        expect(mail.fetchMessage).not.toHaveBeenCalled();
    });

    it('fetches a message reference no slice holds from the messages endpoint', async () => {
        const { references, reference } = mintMessage();
        const mail = mailWith();

        await expect(resolveFreshElements(mail, [reference], references)).resolves.toEqual([message]);
        expect(mail.fetchMessage).toHaveBeenCalledWith('MESSAGE_1');
        expect(mail.fetchConversation).not.toHaveBeenCalled();
    });

    // Retrying cannot bring a deleted email back, so the model needs a fact to relay, named the way the
    // user knows the email.
    it('reports an email the server no longer has as deleted, by its subject', async () => {
        const { references, reference } = mintConversation();
        const mail = mailWith();
        mail.fetchConversation.mockRejectedValue(apiError(API_CODES.NOT_FOUND_ERROR));

        const resolving = resolveFreshElements(mail, [reference], references);

        await expect(resolving).rejects.toThrow(ToolInputError);
        await expect(resolving).rejects.toThrow(`Email ${reference} ("Booking") no longer exists`);
    });

    it('lets any other fetch failure through as it is, rather than calling the email deleted', async () => {
        const { references, reference } = mintMessage();
        const mail = mailWith();
        const offline = new Error('offline');
        mail.fetchMessage.mockRejectedValue(offline);

        await expect(resolveFreshElements(mail, [reference], references)).rejects.toBe(offline);
    });

    it('lets an invalid-id failure through rather than calling the email deleted', async () => {
        const { references, reference } = mintMessage();
        const mail = mailWith();
        const wrongEndpoint = apiError(API_CODES.INVALID_ID_ERROR);
        mail.fetchMessage.mockRejectedValue(wrongEndpoint);

        await expect(resolveFreshElements(mail, [reference], references)).rejects.toBe(wrongEndpoint);
    });

    // The hooks report an empty selection as a bare `'Elements are required'` (or silently do nothing), so
    // without this the model is told only that the tool failed, and Lumo tells the user it worked.
    it('rejects an empty selection with something the model can act on', async () => {
        const { references } = mintConversation();

        await expect(resolveFreshElements(mailWith(), [], references)).rejects.toThrow(/at least one email-…/);
    });
});

const storeWith = ({
    elements = {},
    blockedLabelIDs = [],
}: { elements?: Record<string, unknown>; blockedLabelIDs?: string[] } = {}) =>
    ({
        getState: () => ({
            elements: {
                elements,
                params: { labelID: MAILBOX_LABEL_IDS.INBOX },
                taskRunning: { labelIDs: blockedLabelIDs, timeoutID: undefined },
            },
        }),
    }) as unknown as ToolStore;

describe('resolveElements', () => {
    const registry = () => {
        const references = createReferenceRegistry();
        return { references, reference: references.referenceFor('email', 'ELEMENT_1', { title: 'Booking' }) };
    };

    it('resolves each reference to the element the mutation hooks operate on', () => {
        const { references, reference } = registry();
        const element = { ID: 'ELEMENT_1' };

        expect(resolveElements(storeWith({ elements: { ELEMENT_1: element } }), [reference], references)).toEqual([
            element,
        ]);
    });

    // The hooks report an empty selection as a bare `'Elements are required'` (or silently do nothing), so
    // without this the model is told only that the tool failed — and Lumo tells the user it worked.
    it('rejects an empty selection with something the model can act on', () => {
        const { references } = registry();

        expect(() => resolveElements(storeWith(), [], references)).toThrow(ToolInputError);
        expect(() => resolveElements(storeWith(), [], references)).toThrow(/at least one email-…/);
    });

    it('rejects a reference whose element is no longer on screen', () => {
        const { references, reference } = registry();

        expect(() => resolveElements(storeWith(), [reference], references)).toThrow(/no longer loaded on screen/);
    });

    // A mark-all is the usual reason, and it is temporary: saying so is the difference between Lumo
    // explaining the wait and Lumo retrying a call that cannot succeed yet.
    it('names the bulk action when one is what cleared the list', () => {
        const { references, reference } = registry();
        const store = storeWith({ blockedLabelIDs: [MAILBOX_LABEL_IDS.INBOX] });

        expect(() => resolveElements(store, [reference], references)).toThrow(/bulk action is still running/);
    });

    // The element was collected wherever the bulk action is running, not necessarily where the view sits now.
    it('names the bulk action when it is running outside the current view', () => {
        const { references, reference } = registry();
        const store = storeWith({ blockedLabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] });

        expect(() => resolveElements(store, [reference], references)).toThrow(/bulk action is still running/);
    });
});

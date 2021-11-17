import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { render, clearAll, messageCache, addApiMock } from '../../helpers/test/helper';
import { Breakpoints } from '../../models/utils';
import ConversationView from './ConversationView';
import { Conversation } from '../../models/conversation';
import { ConversationState } from '../../logic/conversations/conversationsTypes';
import { store } from '../../logic/store';
import { initialize, updateConversation } from '../../logic/conversations/conversationsActions';

describe('ConversationView', () => {
    const props = {
        hidden: false,
        labelID: 'labelID',
        conversationID: 'conversationID',
        mailSettings: {} as MailSettings,
        onBack: jest.fn(),
        onCompose: jest.fn(),
        breakpoints: {} as Breakpoints,
        onMessageReady: jest.fn(),
        columnLayout: true,
        isComposerOpened: false,
        containerRef: { current: null },
    };
    const conversation = {
        ID: props.conversationID,
        Subject: 'conversation subject',
    } as Conversation;
    const message = {
        ID: 'messageID',
        Body: 'body',
        Subject: 'message subject',
    } as Message;
    const conversationCacheEntry = {
        Conversation: conversation,
        Messages: [message],
        loadRetry: 0,
        errors: {},
    } as ConversationState;

    const setup = async () => {
        const result = await render(<ConversationView {...props} />);
        const rerender = (newProps: Partial<typeof props> = {}) =>
            result.rerender(<ConversationView {...props} {...newProps} />);
        return { ...result, rerender };
    };

    beforeEach(clearAll);

    it('should return store value', async () => {
        store.dispatch(initialize(conversationCacheEntry));
        messageCache.set(message.ID, { localID: message.ID, data: message });
        const { getByText } = await setup();
        getByText(conversation.Subject as string);
    });

    it('should update value if store is updated', async () => {
        store.dispatch(initialize(conversationCacheEntry));
        messageCache.set(message.ID, { localID: message.ID, data: message });
        const { getByText, rerender } = await setup();
        getByText(conversation.Subject as string);

        const newSubject = 'other subject';

        store.dispatch(
            updateConversation({
                ID: conversation.ID,
                updates: { Conversation: { Subject: newSubject, ID: conversation.ID } },
            })
        );

        await rerender();
        getByText(newSubject);
    });

    it('should launch api request when needed', async () => {
        const response = { Conversation: conversation, Messages: [message] };
        addApiMock(`mail/v4/conversations/${conversation.ID}`, () => response);
        const { getByText } = await setup();
        getByText(conversation.Subject as string);
    });

    it('should change conversation when id change', async () => {
        const conversation2 = { ID: 'conversationID2', Subject: 'other conversation subject' } as Conversation;
        const conversationCacheEntry2 = {
            Conversation: conversation2,
            Messages: [message],
            loadRetry: 0,
            errors: {},
        } as ConversationState;

        store.dispatch(initialize(conversationCacheEntry));
        store.dispatch(initialize(conversationCacheEntry2));

        const { getByText, rerender } = await setup();
        getByText(conversation.Subject as string);

        await rerender({ conversationID: conversation2.ID });
        getByText(conversation2.Subject as string);
    });
});

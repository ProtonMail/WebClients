import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { render, clearAll, addApiMock, assertFocus, tick } from '../../helpers/test/helper';
import { Breakpoints } from '../../models/utils';
import ConversationView from './ConversationView';
import { Conversation } from '../../models/conversation';
import { ConversationState } from '../../logic/conversations/conversationsTypes';
import { store } from '../../logic/store';
import {
    initialize as initializeConversation,
    updateConversation,
} from '../../logic/conversations/conversationsActions';
import { initialize as initializeMessage } from '../../logic/messages/read/messagesReadActions';
import { fireEvent } from '@testing-library/dom';
import { range } from '@proton/shared/lib/helpers/array';

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
        Subject: 'message subject',
        Sender: {},
        Attachments: [] as any,
    } as Message;
    const conversationState = {
        Conversation: conversation,
        Messages: [message],
        loadRetry: 0,
        errors: {},
    } as ConversationState;

    const setup = async () => {
        const result = await render(<ConversationView {...props} />);
        const rerender = (newProps: Partial<typeof props> = {}) =>
            result.rerender(<ConversationView {...props} {...newProps} />);

        const messageElements = result.container.querySelectorAll('[data-shortcut-target="message-container"]');
        const message = messageElements[0];

        return {
            ...result,
            rerender,
            messageElements,
            left: () => fireEvent.keyDown(message, { key: 'ArrowLeft' }),
            down: () => fireEvent.keyDown(messageElements[0], { key: 'ArrowDown' }),
            ctrlDown: () => fireEvent.keyDown(messageElements[0], { key: 'ArrowDown', ctrlKey: true }),
            up: () => fireEvent.keyDown(messageElements[0], { key: 'ArrowUp' }),
            ctrlUp: () => fireEvent.keyDown(messageElements[0], { key: 'ArrowUp', ctrlKey: true }),
            enter: () => fireEvent.keyDown(messageElements[0], { key: 'Enter' }),
        };
    };

    beforeEach(clearAll);

    it('should return store value', async () => {
        store.dispatch(initializeConversation(conversationState));
        store.dispatch(initializeMessage({ localID: message.ID, data: message }));
        const { getByText } = await setup();
        getByText(conversation.Subject as string);
    });

    it('should update value if store is updated', async () => {
        store.dispatch(initializeConversation(conversationState));
        store.dispatch(initializeMessage({ localID: message.ID, data: message }));
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
        const conversationState2 = {
            Conversation: conversation2,
            Messages: [message],
            loadRetry: 0,
            errors: {},
        } as ConversationState;

        store.dispatch(initializeConversation(conversationState));
        store.dispatch(initializeConversation(conversationState2));

        const { getByText, rerender } = await setup();
        getByText(conversation.Subject as string);

        await rerender({ conversationID: conversation2.ID });
        getByText(conversation2.Subject as string);
    });

    describe('Hotkeys', () => {
        it('should focus item container on left', async () => {
            store.dispatch(initializeConversation(conversationState));

            const TestComponent = (props: any) => {
                return (
                    <>
                        <div data-shortcut-target="item-container" tabIndex={-1}>
                            item container test
                        </div>
                        <ConversationView {...props} />
                    </>
                );
            };

            const { container } = await render(<TestComponent {...props} />);

            const itemContainer = container.querySelector('[data-shortcut-target="item-container"]');
            const firstMessage = container.querySelector('[data-shortcut-target="message-container"]') as HTMLElement;

            fireEvent.keyDown(firstMessage, { key: 'ArrowLeft' });

            assertFocus(itemContainer);
        });

        it('should navigate through messages with up and down', async () => {
            const messages = range(0, 10).map(
                (i) =>
                    ({
                        ID: `messageID${i}`,
                        Subject: `message subject ${i}`,
                    } as Message)
            );
            const conversationState = {
                Conversation: conversation,
                Messages: messages,
                loadRetry: 0,
                errors: {},
            } as ConversationState;

            store.dispatch(initializeConversation(conversationState));

            const { messageElements, down, ctrlDown, up, ctrlUp } = await setup();

            down();
            assertFocus(messageElements[0]);
            down();
            assertFocus(messageElements[1]);
            down();
            assertFocus(messageElements[2]);
            up();
            assertFocus(messageElements[1]);
            up();
            assertFocus(messageElements[0]);
            ctrlDown();
            assertFocus(messageElements[9]);
            ctrlUp();
            assertFocus(messageElements[0]);
        });

        it('should open a message on enter', async () => {
            store.dispatch(initializeConversation(conversationState));

            const messageMock = jest.fn(() => ({ Message: { ID: message.ID, Attachments: [] } }));
            addApiMock(`mail/v4/messages/${message.ID}`, messageMock);

            const { down, enter } = await setup();

            down();
            enter();

            await tick();

            expect(messageMock).toHaveBeenCalled();
        });
    });
});

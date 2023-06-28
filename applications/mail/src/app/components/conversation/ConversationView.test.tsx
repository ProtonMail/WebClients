import { fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';

import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import range from '@proton/utils/range';

import { addApiKeys, addApiMock, assertFocus, clearAll, mockConsole, render, tick } from '../../helpers/test/helper';
import {
    initialize as initializeConversation,
    updateConversation,
} from '../../logic/conversations/conversationsActions';
import { ConversationState } from '../../logic/conversations/conversationsTypes';
import { initialize as initializeMessage } from '../../logic/messages/read/messagesReadActions';
import { store } from '../../logic/store';
import { Conversation } from '../../models/conversation';
import { Breakpoints } from '../../models/utils';
import ConversationView from './ConversationView';

jest.setTimeout(20000);

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
        elementIDs: ['conversationID'],
        loadingElements: false,
        conversationMode: true,
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

        const messageElements = result.container.querySelectorAll<HTMLElement>(
            '[data-shortcut-target="message-container"]'
        );
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

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Store / State management', () => {
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
    });

    describe('Auto reload', () => {
        const waitForSpyCalls = (spy: jest.Mock, count: number) =>
            waitFor(
                () => {
                    expect(spy).toBeCalledTimes(count);
                },
                { timeout: 20000 }
            );

        it('should reload a conversation if first request failed', async () => {
            jest.useFakeTimers();
            mockConsole();

            const response = { Conversation: conversation, Messages: [message] };
            const getSpy = jest.fn(() => {
                if (getSpy.mock.calls.length === 1) {
                    const error = new Error();
                    error.name = 'NetworkError';
                    throw error;
                }
                return response;
            });
            addApiMock(`mail/v4/conversations/${conversation.ID}`, getSpy);

            const { getByTestId, getByText, rerender } = await setup();

            const header = getByTestId('conversation-header') as HTMLHeadingElement;
            expect(header.getAttribute('class')).toContain('is-loading');

            jest.advanceTimersByTime(5000);
            await waitForSpyCalls(getSpy, 2);
            await rerender();

            expect(header.getAttribute('class')).not.toContain('is-loading');
            getByText(conversation.Subject as string);
            expect(getSpy).toHaveBeenCalledTimes(2);

            jest.runAllTimers();
        });

        it('should show error banner after 4 attemps', async () => {
            jest.useFakeTimers();
            mockConsole();

            const getSpy = jest.fn(() => {
                const error = new Error();
                error.name = 'NetworkError';
                throw error;
            });
            addApiMock(`mail/v4/conversations/${conversation.ID}`, getSpy);

            const { getByText } = await setup();

            await act(async () => {
                jest.advanceTimersByTime(5000);
                await waitForSpyCalls(getSpy, 2);
                jest.advanceTimersByTime(5000);
                await waitForSpyCalls(getSpy, 3);
                jest.advanceTimersByTime(5000);
                await waitForSpyCalls(getSpy, 4);
            });

            getByText('Network error', { exact: false });
            getByText('Try again');
            expect(getSpy).toHaveBeenCalledTimes(4);

            jest.runAllTimers();
        });

        it('should retry when using the Try again button', async () => {
            const conversationState = {
                Conversation: { ID: conversation.ID },
                Messages: [],
                loadRetry: 4,
                errors: { network: [new Error()] },
            } as ConversationState;

            store.dispatch(initializeConversation(conversationState));

            const response = { Conversation: conversation, Messages: [message] };
            addApiMock(`mail/v4/conversations/${conversation.ID}`, () => response);

            const { getByText, rerender } = await setup();

            const tryAgain = getByText('Try again');
            fireEvent.click(tryAgain);

            await rerender();

            getByText(conversation.Subject as string);
        });
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

            const isFocused = (element: HTMLElement) => element.dataset.hasfocus === 'true';

            down();
            expect(isFocused(messageElements[0])).toBe(true);
            down();
            expect(isFocused(messageElements[1])).toBe(true);
            down();
            expect(isFocused(messageElements[2])).toBe(true);
            up();
            expect(isFocused(messageElements[1])).toBe(true);
            up();
            expect(isFocused(messageElements[0])).toBe(true);
            ctrlDown();
            expect(isFocused(messageElements[9])).toBe(true);
            ctrlUp();
            expect(isFocused(messageElements[0])).toBe(true);
        });

        it('should open a message on enter', async () => {
            const senderEmail = 'sender@email.com';
            addApiKeys(false, senderEmail, []);

            store.dispatch(initializeConversation(conversationState));

            const messageMock = jest.fn(() => ({
                Message: { ID: message.ID, Attachments: [], Sender: { Name: '', Address: senderEmail } },
            }));
            addApiMock(`mail/v4/messages/${message.ID}`, messageMock);

            const { down, enter } = await setup();

            down();
            enter();

            await tick();

            expect(messageMock).toHaveBeenCalled();
        });
    });
});

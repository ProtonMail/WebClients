import { renderHook } from '@testing-library/react';

import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import useUnreadNotifications from 'proton-mail/hooks/useUnreadNotifications';

jest.mock('@proton/shared/lib/mail/messages', () => ({
    isReceived: jest.fn(() => true),
}));

const conversationID1 = 'conversationID1';
const conversationID2 = 'conversationID2';

const message1 = {
    ID: 'message1',
    Time: Date.now(),
    ConversationID: conversationID1,
    Unread: 0,
} as Message;

describe('useUnreadNotifications', () => {
    it('should display the unread notification when receiving a new unread message, and hide it when message is marked as read', () => {
        // Initially there's one message in the conversation that is read
        const initialProps = {
            messages: [message1],
            conversationID: conversationID1,
        };

        const { result, rerender } = renderHook(
            ({ messages, conversationID }: { messages: Message[]; conversationID: string }) =>
                useUnreadNotifications(messages, conversationID),
            { initialProps }
        );

        expect(result.current.unreadMessageAfterTimeMarkerIds).toEqual([]);

        // Then, we receive a new message that is unread, notification should be shown
        const message2 = {
            ID: 'message2',
            Time: Date.now(),
            ConversationID: conversationID1,
            Unread: 1,
        } as Message;

        rerender({ messages: [message1, message2], conversationID: conversationID1 });

        expect(result.current.unreadMessageAfterTimeMarkerIds).toEqual([message2.ID]);

        // Finally, we receive an update that the latest message has been marked as read, notification should be hidden
        rerender({ messages: [message1, { ...message2, Unread: 0 }], conversationID: conversationID1 });

        expect(result.current.unreadMessageAfterTimeMarkerIds).toEqual([]);
    });

    it('should update the notification state when switching conversation', () => {
        // Initially there's one message in the conversation that is read
        const initialProps = {
            messages: [message1],
            conversationID: conversationID1,
        };

        const { result, rerender } = renderHook(
            ({ messages, conversationID }: { messages: Message[]; conversationID: string }) =>
                useUnreadNotifications(messages, conversationID),
            { initialProps }
        );

        expect(result.current.unreadMessageAfterTimeMarkerIds).toEqual([]);

        // Then, we receive a new message that is unread, notification should be shown
        const message2 = {
            ID: 'message2',
            Time: Date.now(),
            ConversationID: conversationID1,
            Unread: 1,
        } as Message;

        rerender({ messages: [message1, message2], conversationID: conversationID1 });

        expect(result.current.unreadMessageAfterTimeMarkerIds).toEqual([message2.ID]);

        // Then, the user is switching conversation, the notification should be hidden
        const messageFromAnotherConversation = {
            ID: 'message3',
            Time: Date.now(),
            ConversationID: conversationID2,
            Unread: 0,
        } as Message;

        rerender({ messages: [messageFromAnotherConversation], conversationID: conversationID2 });

        expect(result.current.unreadMessageAfterTimeMarkerIds).toEqual([]);
    });
});

import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { ChatThread } from './ChatThread';

vi.mock('@proton/theme/ThemeProvider', () => ({
    useTheme: () => ({ information: { motionMode: 'no-preference', features: { animations: false } } }),
}));

vi.mock('../../hooks/bridges/useChatMessage', () => ({
    useChatMessage: () => ({ sendMessage: vi.fn() }),
}));

vi.mock('./ChatItem', () => ({
    ChatItem: ({ item, onReply }: { item: MeetChatMessage; onReply?: () => void }) => (
        <div>
            {item.message}
            {onReply && (
                <button type="button" onClick={onReply}>
                    Reply
                </button>
            )}
        </div>
    ),
}));

vi.mock('../ChatMessage/ChatMessage', () => ({
    ChatMessage: ({ autoFocus }: { autoFocus?: boolean }) => <input aria-label="Reply field" autoFocus={autoFocus} />,
}));

const message = (id: string, text: string, topicId?: string): MeetChatMessage =>
    ({
        id,
        type: 'message',
        identity: 'local-user',
        name: 'Local',
        timestamp: 1,
        message: text,
        topicId,
        seen: true,
    }) as unknown as MeetChatMessage;

const renderThread = () => {
    const store = configureStore({ reducer: { ...chatAndReactionsReducer } });
    return render(
        <Provider store={store} context={ProtonStoreContext}>
            <ChatThread rootMessage={message('root', 'Root')} replies={[message('reply', 'First reply', 'root')]} />
        </Provider>
    );
};

describe('ChatThread', () => {
    let scrollIntoView: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView'];
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            callback(0);
            return 0;
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('scrolls the whole reply field into view when Reply opens it', () => {
        renderThread();
        expect(scrollIntoView).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Reply' }));

        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
        expect(scrollIntoView.mock.contexts[0]).toBe(document.querySelector('.chat-thread-reply'));
    });

    it('leaves the chat where it is when focus returns to an open reply field', () => {
        renderThread();
        fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
        scrollIntoView.mockClear();

        const field = screen.getByRole('textbox', { name: 'Reply field' });
        act(() => {
            field.blur();
            field.focus();
        });

        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});

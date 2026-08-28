import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    initialState as initialParticipantsState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { sortedParticipantsReducer } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { ChatItem } from './ChatItem';

vi.mock('@livekit/components-react', () => ({
    useLocalParticipant: () => ({ localParticipant: { identity: 'local-user' } }),
    useRoomContext: () => ({ localParticipant: { identity: 'local-user' } }),
}));

vi.mock('../../hooks/bridges/useChatMessageReaction', () => ({
    useChatMessageReaction: () => vi.fn(),
}));

const mockRetryMessage = vi.fn();
const mockDiscardMessage = vi.fn();

vi.mock('../../hooks/bridges/useChatMessage', () => ({
    useChatMessage: () => ({
        sendMessage: vi.fn(),
        retryMessage: mockRetryMessage,
        discardMessage: mockDiscardMessage,
    }),
}));

const timestamp = 1718534400;

const roomName = 'Mock Room Name';

const mockEncryptedDisplayName = 'encrypted-john-doe';
const mockParticipantName = 'John Doe';

const mockChatMessage: MeetChatMessage = {
    type: 'message',
    timestamp,
    identity: '123',
    message: 'Hello, world!',
    id: 'test-message-id',
};

const mockParticipantEventRecord: ParticipantEventRecord = {
    type: 'event',
    timestamp,
    identity: '123',
    eventType: ParticipantEvent.Join,
};

const date = new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

const createMockStore = () => {
    return configureStore({
        reducer: {
            ...sortedParticipantsReducer,
            ...participantsReducer,
            ...chatAndReactionsReducer,
        },
        preloadedState: {
            participants: {
                ...initialParticipantsState,
                participantsMap: {
                    '123': {
                        ParticipantUUID: '123',
                        EncryptedDisplayName: mockEncryptedDisplayName,
                    },
                },
                participantDecryptedNameMap: {
                    '123': mockParticipantName,
                },
            },
        },
    });
};

describe('ChatItem', () => {
    afterEach(cleanup);

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        const store = createMockStore();

        return (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        );
    };

    it('should render a chat message', () => {
        render(
            <Wrapper>
                <ChatItem item={mockChatMessage} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockParticipantName)).toBeInTheDocument();
        expect(screen.getByText(mockChatMessage.message)).toBeInTheDocument();
        expect(screen.getByText(date)).toBeInTheDocument();
    });

    it('should render a participant event record', () => {
        render(
            <Wrapper>
                <ChatItem item={mockParticipantEventRecord} displayDate={false} roomName={roomName} />
            </Wrapper>
        );

        expect(screen.getByText(mockParticipantName)).toBeInTheDocument();
        expect(screen.getByText('Joined')).toBeInTheDocument();
        expect(screen.getByText(roomName)).toBeInTheDocument();
        expect(screen.queryByText(date)).not.toBeInTheDocument();
    });

    it('should render the participant initials', () => {
        render(
            <Wrapper>
                <ChatItem item={mockChatMessage} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render a pending message with disabled text color and no error UI', () => {
        render(
            <Wrapper>
                <ChatItem item={{ ...mockChatMessage, status: 'pending' }} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockChatMessage.message)).toHaveClass('color-disabled');
        expect(screen.queryByText('Not sent, check your connection.')).not.toBeInTheDocument();
    });

    it('should render a sent message with the default text color', () => {
        render(
            <Wrapper>
                <ChatItem item={{ ...mockChatMessage, status: 'sent' }} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockChatMessage.message)).toHaveClass('color-norm');
    });

    it('should render retry/discard actions and an error message for a failed message', async () => {
        const user = userEvent.setup();

        render(
            <Wrapper>
                <ChatItem item={{ ...mockChatMessage, status: 'failed' }} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockChatMessage.message)).toHaveClass('color-disabled');
        expect(screen.getByText('Not sent, check your connection.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry' }));
        expect(mockRetryMessage).toHaveBeenCalledWith({ ...mockChatMessage, status: 'failed' });

        await user.click(screen.getByRole('button', { name: 'Discard' }));
        expect(mockDiscardMessage).toHaveBeenCalledWith(mockChatMessage.id);
    });
});

import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { initialState as initialMeetingInfoState, meetingInfoReducer } from '@proton/meet/store/slices';
import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { sortedParticipantsReducer } from '@proton/meet/store/slices/sortedParticipantsSlice';
import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { ChatItem } from './ChatItem';

vi.mock('@livekit/components-react', () => ({
    useLocalParticipant: () => ({ localParticipant: { identity: 'local-user' } }),
}));

vi.mock('../../hooks/bridges/useChatMessageReaction', () => ({
    useChatMessageReaction: () => vi.fn(),
}));

const timestamp = 1718534400;

const roomName = 'Mock Room Name';

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
            ...meetingInfoReducer,
            ...chatAndReactionsReducer,
        },
        preloadedState: {
            meetingInfo: {
                ...initialMeetingInfoState,
                participantNameMap: {
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
});

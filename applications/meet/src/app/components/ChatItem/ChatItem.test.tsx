import { cleanup, render, screen } from '@testing-library/react';

import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';

import { MeetContext } from '../../contexts/MeetContext';
import { ChatItem } from './ChatItem';

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

const mockContextValue = {
    participantNameMap: {
        '123': mockParticipantName,
    },
};

const date = new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

describe('ChatItem', () => {
    afterEach(cleanup);

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <MeetContext.Provider
            // @ts-expect-error - mock data
            value={mockContextValue}
        >
            {children}
        </MeetContext.Provider>
    );

    it('should render a chat message', () => {
        render(
            <Wrapper>
                <ChatItem
                    item={mockChatMessage}
                    colors={{ backgroundColor: 'text-primary', profileTextColor: 'text-primary' }}
                    displayDate={true}
                />
            </Wrapper>
        );

        expect(screen.getByText(mockParticipantName)).toBeInTheDocument();
        expect(screen.getByText(mockChatMessage.message)).toBeInTheDocument();
        expect(screen.getByText(date)).toBeInTheDocument();
    });

    it('should render a participant event record', () => {
        render(
            <Wrapper>
                <ChatItem
                    item={mockParticipantEventRecord}
                    colors={{ backgroundColor: 'text-primary', profileTextColor: 'text-primary' }}
                    displayDate={false}
                    roomName={roomName}
                />
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
                <ChatItem
                    item={mockChatMessage}
                    colors={{ backgroundColor: 'text-primary', profileTextColor: 'text-primary' }}
                    displayDate={true}
                />
            </Wrapper>
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
    });
});

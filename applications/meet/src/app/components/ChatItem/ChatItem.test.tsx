import { cleanup, render, screen } from '@testing-library/react';

import type { MeetChatMessage, ParticipantEventRecord } from '../../types';
import { ChatItem } from './ChatItem';

const timestamp = 1718534400;

const roomName = 'Mock Room Name';

const mockChatMessage = {
    type: 'message',
    name: 'John Doe',
    timestamp,
    identity: '123',
    message: 'Hello, world!',
} as MeetChatMessage;

const mockParticipantEventRecord = {
    type: 'event',
    name: 'John Doe',
    timestamp,
    identity: '123',
    eventType: 'join',
} as ParticipantEventRecord;

const date = new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

describe('ChatItem', () => {
    afterEach(cleanup);

    it('should render a chat message', () => {
        render(
            <ChatItem
                item={mockChatMessage}
                colors={{ backgroundColor: 'text-primary', profileTextColor: 'text-primary' }}
                displayDate={true}
            />
        );

        expect(screen.getByText(mockChatMessage.name)).toBeInTheDocument();
        expect(screen.getByText(mockChatMessage.message)).toBeInTheDocument();
        expect(screen.getByText(date)).toBeInTheDocument();
    });

    it('should render a participant event record', () => {
        render(
            <ChatItem
                item={mockParticipantEventRecord}
                colors={{ backgroundColor: 'text-primary', profileTextColor: 'text-primary' }}
                displayDate={false}
                roomName={roomName}
            />
        );

        expect(screen.getByText(mockParticipantEventRecord.name)).toBeInTheDocument();
        expect(screen.getByText('Joined')).toBeInTheDocument();
        expect(screen.getByText(roomName)).toBeInTheDocument();
        expect(screen.queryByText(date)).not.toBeInTheDocument();
    });

    it('should render the participant initials', () => {
        render(
            <ChatItem
                item={mockChatMessage}
                colors={{ backgroundColor: 'text-primary', profileTextColor: 'text-primary' }}
                displayDate={true}
            />
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
    });
});

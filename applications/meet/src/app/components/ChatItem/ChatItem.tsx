import { clsx } from 'clsx';
import { c } from 'ttag';

import {
    type MeetChatMessage,
    type MeetingRoomUpdate,
    ParticipantEvent,
    type ParticipantEventRecord,
} from '@proton/meet/types/types';

import { useMeetContext } from '../../contexts/MeetContext';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { ChatMessageContent } from '../ChatMessageContent';

import './ChatItem.scss';

interface ChatItemProps {
    roomName?: string;
    item: MeetingRoomUpdate;
    colors: {
        backgroundColor: string;
        profileTextColor: string;
    };
    displayDate?: boolean;
    shouldGrow?: boolean;
    ellipsisOverflow?: boolean;
}

const isMeetChatMessage = (item: MeetingRoomUpdate): item is MeetChatMessage => {
    return item.type === 'message';
};

const isParticipantEventRecord = (item: MeetingRoomUpdate): item is ParticipantEventRecord => {
    return item.type === 'event';
};

export const ChatItem = ({
    roomName,
    item,
    colors,
    displayDate = true,
    shouldGrow = false,
    ellipsisOverflow = false,
}: ChatItemProps) => {
    const { type, identity, timestamp } = item;

    const { participantNameMap } = useMeetContext();

    const participantName = participantNameMap[identity];

    const roomNameLabel = (
        <span key="room-name" className="ml-1 room-name">
            {roomName}
        </span>
    );

    return (
        <div
            key={`${type}-${name}-${timestamp}`}
            className={clsx(
                'chat-item flex gap-2 height-custom flex-nowrap shrink-0 mr-2',
                (shouldGrow || ellipsisOverflow) && 'flex-1'
            )}
            style={{ '--height-custom': 'fit-content' }}
        >
            <div className="flex flex-nowrap items-start shrink-0">
                <div
                    className={clsx(
                        colors.backgroundColor,
                        colors.profileTextColor,
                        'color-invert rounded-full flex items-center justify-center w-custom h-custom'
                    )}
                    style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                >
                    <div>{getParticipantInitials(participantName)}</div>
                </div>
            </div>

            <div className="flex flex-column flex-nowrap justify-start">
                <div className="flex items-start text-semibold flex-nowrap">
                    <span className="text-ellipsis" title={participantName}>
                        {participantName}
                    </span>
                    {displayDate && (
                        <div className="ml-2 color-weak text-nowrap shrink-0">
                            {new Date(timestamp).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </div>
                    )}
                </div>
                {isMeetChatMessage(item) && (
                    <div
                        className={clsx(
                            'color-norm text-semibold chat-message text-break',
                            ellipsisOverflow && 'text-ellipsis-four-lines'
                        )}
                    >
                        <ChatMessageContent message={item.message} />
                    </div>
                )}
                {isParticipantEventRecord(item) && (
                    <div
                        className={clsx(
                            'block text-semibold color-weak text-break',
                            ellipsisOverflow && 'participant-enter--ellipsis'
                        )}
                    >
                        {
                            // translator: full sentence is "Joined <room name>" or "Left <room name>" (please keep the style, do NOT translate by saying "You joined...", as it might be misleading)
                            item.eventType === ParticipantEvent.Join
                                ? c('Info').jt`Joined ${roomNameLabel}`
                                : c('Info').jt`Left ${roomNameLabel}`
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

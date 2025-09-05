import { clsx } from 'clsx';
import { c } from 'ttag';

import {
    type MeetChatMessage,
    type MeetingRoomUpdate,
    ParticipantEvent,
    type ParticipantEventRecord,
} from '../../types';
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
    const { type, name, timestamp } = item;

    return (
        <div
            key={`${type}-${name}-${timestamp}`}
            className={clsx(
                'flex gap-2 height-custom flex-nowrap shrink-0',
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
                    <div>{getParticipantInitials(name)}</div>
                </div>
            </div>

            <div className="flex flex-column flex-nowrap justify-start">
                <div className="flex items-start text-semibold">
                    <span className="max-w-custom text-ellipsis" style={{ '--max-w-custom': '14rem' }} title={name}>
                        {name}
                    </span>
                    {displayDate && (
                        <div className="ml-2 color-weak">
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
                            'color-weak text-semibold chat-message',
                            ellipsisOverflow && 'text-ellipsis chat-message-one-line'
                        )}
                    >
                        <ChatMessageContent message={item.message} />
                    </div>
                )}
                {isParticipantEventRecord(item) && (
                    <div className="flex justify-start items-start text-semibold">
                        <span className="color-weak">
                            {item.eventType === ParticipantEvent.Join ? c('Info').t`Joined` : c('Info').t`Left`}
                        </span>

                        <span className="ml-1" style={{ color: 'var(--interaction-norm)' }}>
                            {roomName}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

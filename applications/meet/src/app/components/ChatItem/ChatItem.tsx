import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantNameMap } from '@proton/meet/store/slices/meetingInfo';
import {
    type MeetChatMessage,
    type MeetingRoomUpdate,
    ParticipantEvent,
    type ParticipantEventRecord,
} from '@proton/meet/types/types';

import { useChatMessageReaction } from '../../hooks/bridges/useChatMessageReaction';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { ChatMessageContent } from '../ChatMessageContent';
import { ChatMessageReactions } from './ChatMessageReactions';

import './ChatItem.scss';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👎'];

interface ChatItemProps {
    roomName?: string;
    item: MeetingRoomUpdate;
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
    displayDate = true,
    shouldGrow = false,
    ellipsisOverflow = false,
}: ChatItemProps) => {
    const { type, identity, timestamp } = item;

    const participantNameMap = useMeetSelector(selectParticipantNameMap);
    const sendReaction = useChatMessageReaction();

    const [isHovered, setIsHovered] = useState(false);
    const { participantColors } = useParticipantDisplayColors(identity);

    const participantName = participantNameMap[identity];

    const showReactionControls = isMeetChatMessage(item) && !ellipsisOverflow;

    const roomNameLabel = (
        <span key="room-name" className="ml-1 room-name">
            {roomName}
        </span>
    );

    return (
        <div
            key={`${type}-${identity}-${timestamp}`}
            className={clsx(
                'chat-item flex gap-2 height-custom flex-nowrap shrink-0 mr-2 py-2 px-1',
                (shouldGrow || ellipsisOverflow) && 'flex-1',
                isHovered && 'chat-item-message-hover'
            )}
            style={{ '--height-custom': 'fit-content' }}
            onMouseEnter={() => showReactionControls && setIsHovered(true)}
            onMouseLeave={() => showReactionControls && setIsHovered(false)}
        >
            <div className="flex flex-nowrap items-start shrink-0">
                <div
                    className={clsx(
                        participantColors.backgroundColor,
                        participantColors.profileTextColor,
                        'color-invert rounded-full flex items-center justify-center w-custom h-custom'
                    )}
                    style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                >
                    <div>{getParticipantInitials(participantName)}</div>
                </div>
            </div>

            <div className="flex flex-column flex-nowrap justify-start flex-1 min-w-0">
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
                    <div className="relative">
                        {showReactionControls && isHovered && (
                            <div className="chat-item-quick-reactions flex gap-1 p-1 rounded-lg border border-weak bg-norm shadow-norm absolute">
                                {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className="chat-item-quick-reaction-btn text-xl rounded-full flex items-center justify-center"
                                        aria-label={c('Action').t`React with ${emoji}`}
                                        onClick={() => {
                                            void sendReaction(item.id, emoji);
                                            setIsHovered(false);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div
                            className={clsx(
                                'color-norm text-semibold chat-message text-break',
                                ellipsisOverflow && 'text-ellipsis-four-lines'
                            )}
                        >
                            <ChatMessageContent message={item.message} />
                        </div>
                        {showReactionControls && (
                            <ChatMessageReactions
                                messageId={item.id}
                                onReact={(emoji) => {
                                    void sendReaction(item.id, emoji);
                                }}
                            />
                        )}
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

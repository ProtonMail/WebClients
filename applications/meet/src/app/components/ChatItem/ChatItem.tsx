import { clsx } from 'clsx';
import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantName } from '@proton/meet/store/slices/meetingInfo';
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

    const participantName = useMeetSelector((state) => selectParticipantName(state, identity));
    const sendReaction = useChatMessageReaction();

    const { participantColors } = useParticipantDisplayColors(identity);

    const showReactionControls = isMeetChatMessage(item) && !ellipsisOverflow;
    const messageA11yDescriptionId = isMeetChatMessage(item) ? `chat-message-a11y-${item.id}` : undefined;

    const roomNameLabel = (
        <span key="room-name" className="ml-1 room-name">
            {roomName}
        </span>
    );

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            key={`${type}-${identity}-${timestamp}`}
            className={clsx(
                'chat-item flex gap-2 height-custom flex-nowrap shrink-0 mr-2 py-2 px-1',
                (shouldGrow || ellipsisOverflow) && 'flex-1',
                showReactionControls && 'chat-item--with-reactions'
            )}
            style={{ '--height-custom': 'fit-content' }}
            role={showReactionControls ? 'group' : undefined}
            aria-label={showReactionControls ? c('Info').t`Message from ${participantName}` : undefined}
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
                        <bdi>{participantName}</bdi>
                    </span>
                    {displayDate && (
                        <time
                            dateTime={new Date(timestamp).toISOString()}
                            className="ml-2 color-weak text-nowrap shrink-0"
                        >
                            {new Date(timestamp).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </time>
                    )}
                </div>
                {isMeetChatMessage(item) && (
                    <div className="relative">
                        <div
                            id={messageA11yDescriptionId}
                            className={clsx(
                                'color-norm text-semibold chat-message text-break',
                                ellipsisOverflow && 'text-ellipsis-four-lines'
                            )}
                        >
                            <ChatMessageContent message={item.message} />
                        </div>
                        {showReactionControls && (
                            <div
                                className="chat-item-quick-reactions flex gap-1 p-1 rounded-lg border border-weak bg-norm absolute"
                                role="toolbar"
                                aria-label={c('Info').t`Quick reactions`}
                            >
                                {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className="chat-item-quick-reaction-btn text-xl rounded-full flex items-center justify-center"
                                        aria-label={c('Action').t`React with ${emoji}`}
                                        aria-describedby={messageA11yDescriptionId}
                                        onClick={() => {
                                            void sendReaction(item.id, emoji);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showReactionControls && (
                            <ChatMessageReactions
                                messageId={item.id}
                                messageAriaDescriptionId={messageA11yDescriptionId}
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

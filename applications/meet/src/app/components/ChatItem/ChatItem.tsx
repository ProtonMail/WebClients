import type { FocusEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { IcArrowUpAndLeft } from '@proton/icons/icons/IcArrowUpAndLeft';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectLocalParticipantIdentity,
    selectParticipantName,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    type MeetChatMessage,
    type MeetingRoomUpdate,
    ParticipantEvent,
    type ParticipantEventRecord,
} from '@proton/meet/types/types';
import { useFlag } from '@proton/unleash/useFlag';

import { ParticipantAvatar } from '../../atoms/ParticipantAvatar/ParticipantAvatar';
import { useChatMessage } from '../../hooks/bridges/useChatMessage';
import { useChatMessageReaction } from '../../hooks/bridges/useChatMessageReaction';
import { useToolbarRovingFocus } from '../../hooks/useToolbarRovingFocus';
import { getAgentDisplayInfo } from '../../utils/getAgentDisplayInfo';
import { ChatMessageContent } from '../ChatMessageContent';
import { announcementMessages } from '../MeetingAnnouncer/messages';
import { useAnnounce } from '../MeetingAnnouncer/useAnnounce';
import { ChatMessageFailedActions } from './ChatMessageFailedActions';
import { ChatMessageReactions } from './ChatMessageReactions';

import './ChatItem.scss';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🥲', '👎'];

interface ChatItemProps {
    roomName?: string;
    item: MeetingRoomUpdate;
    displayDate?: boolean;
    shouldGrow?: boolean;
    ellipsisOverflow?: boolean;
    /**
     * 'default' renders the item as a top-level chat entry.
     * 'thread' renders a more compact entry meant to be nested inside a thread.
     */
    variant?: 'default' | 'thread';
    /** When provided, a reply button is shown alongside the quick reactions. */
    onReply?: () => void;
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
    variant = 'default',
    onReply,
}: ChatItemProps) => {
    const { type, identity, timestamp } = item;

    const isThreadItem = variant === 'thread';
    const avatarSize = isThreadItem ? '2rem' : '2.5rem';

    const participantName = useMeetSelector((state) => selectParticipantName(state, identity));
    const localParticipantIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const isLocalParticipant = identity === localParticipantIdentity;

    // Agents aren't in the decrypted name map, so resolve their name/avatar from
    // the metadata captured on the event — consistent with the participant list.
    const agentInfo = isParticipantEventRecord(item) && item.isAgent ? getAgentDisplayInfo(item.identity) : null;
    const displayName = agentInfo ? agentInfo.displayName : participantName;
    const sendReaction = useChatMessageReaction();
    const { retryMessage, discardMessage } = useChatMessage();

    const isChatThreadsEnabled = useFlag('MeetChatThreads');

    const isPending = isMeetChatMessage(item) && item.status === 'pending';
    const isFailed = isMeetChatMessage(item) && item.status === 'failed';

    const showReactionControls = isMeetChatMessage(item) && !ellipsisOverflow && !isPending && !isFailed;
    const messageA11yDescriptionId = isMeetChatMessage(item) ? `chat-message-a11y-${item.id}` : undefined;

    // The quick-reaction emoji buttons form a single tab stop; Arrow Left/Right rove
    // between them.
    const { toolbarProps: emojiToolbarProps } = useToolbarRovingFocus<HTMLDivElement>({
        orientation: 'horizontal',
    });

    const roomNameLabel = (
        <span key="room-name" className="ml-1 room-name">
            {roomName}
        </span>
    );

    const isMessage = isMeetChatMessage(item);

    const announce = useAnnounce();

    const rowRef = useRef<HTMLDivElement>(null);

    const [areActionsVisible, setAreActionsVisible] = useState(false);

    useEffect(() => {
        if (!areActionsVisible) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
                setAreActionsVisible(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [areActionsVisible]);

    const handleRowFocus = (event: FocusEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget || !isMeetChatMessage(item)) {
            return;
        }

        announce(announcementMessages.chatMessageContent(item.message, participantName), {
            dedupeKey: `chat-focus-${item.id}`,
        });
    };

    const handleRowClick = () => {
        const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

        if (showReactionControls && !supportsHover) {
            setAreActionsVisible((visible) => !visible);
        }
    };

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events
        <div
            ref={rowRef}
            key={`${type}-${identity}-${timestamp}`}
            className={clsx(
                'chat-item flex gap-2 height-custom flex-nowrap shrink-0 mr-2 py-2 px-1',
                (shouldGrow || ellipsisOverflow) && 'flex-1',
                showReactionControls && 'chat-item--with-reactions',
                areActionsVisible && 'chat-item--actions-visible',
                isThreadItem && 'chat-item--thread'
            )}
            style={{ '--height-custom': 'fit-content' }}
            role={showReactionControls ? 'group' : undefined}
            aria-label={showReactionControls ? c('Info').t`Message from ${participantName}` : undefined}
            // The message itself is the first tab stop for the entry and the landing point for
            // Up/Down arrow navigation between messages; its actions follow it in the tab order.
            tabIndex={isMessage && !ellipsisOverflow ? 0 : undefined}
            data-chat-message-row={isMessage ? '' : undefined}
            onFocus={handleRowFocus}
            onClick={handleRowClick}
        >
            <div className="flex flex-nowrap items-start shrink-0">
                <ParticipantAvatar
                    identity={identity}
                    participantName={participantName}
                    isAgent={Boolean(agentInfo)}
                    size={avatarSize}
                    className={clsx('color-invert', isThreadItem && 'text-sm')}
                />
            </div>

            <div className="flex flex-column flex-nowrap justify-start flex-1 min-w-0">
                <div className="flex items-start text-semibold flex-nowrap">
                    <span className="text-ellipsis" title={displayName}>
                        <bdi>{displayName}</bdi>
                        {isLocalParticipant && <span className="color-weak ml-1">{c('Info').t`(You)`}</span>}
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
                                'text-semibold chat-message text-break',
                                isPending || isFailed ? 'color-disabled' : 'color-norm',
                                ellipsisOverflow && 'text-ellipsis-four-lines'
                            )}
                        >
                            <ChatMessageContent message={item.message} />
                        </div>
                        {isFailed && (
                            <div className="flex flex-column items-start gap-2 mt-2">
                                <div className="flex items-center gap-1 error-message text-sm">
                                    <IcExclamationCircle size={4} className="shrink-0" />
                                    <span>{c('Info').t`Not sent, check your connection.`}</span>
                                </div>
                                <ChatMessageFailedActions
                                    onRetry={() => {
                                        void retryMessage(item);
                                    }}
                                    onDiscard={() => discardMessage(item.id)}
                                />
                            </div>
                        )}
                        {showReactionControls && (
                            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                            <div
                                className="chat-item-quick-reactions flex flex-nowrap items-center absolute gap-1 p-1.5 border rounded-full"
                                role="group"
                                aria-label={c('Info').t`Message actions`}
                            >
                                {isChatThreadsEnabled && onReply && (
                                    <>
                                        <button
                                            type="button"
                                            className="chat-item-quick-reaction-btn chat-item-reply-btn rounded-full flex items-center justify-center rounded-full cursor-pointer"
                                            aria-label={c('Action').t`Reply`}
                                            aria-describedby={messageA11yDescriptionId}
                                            onClick={onReply}
                                        >
                                            <IcArrowUpAndLeft className="rtl:mirror" />
                                        </button>
                                        <span className="chat-item-reply-divider shrink-0" aria-hidden="true" />
                                    </>
                                )}
                                <div
                                    className="flex flex-nowrap items-center gap-0.5"
                                    role="toolbar"
                                    aria-label={c('Info').t`Quick reactions`}
                                    {...emojiToolbarProps}
                                >
                                    {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className="chat-item-emoji-reaction-btn text-xl rounded-full border flex items-center justify-center shrink-0 w-custom h-custom p-custom cursor-pointer rounded-full"
                                            style={{
                                                '--w-custom': '1.875rem',
                                                '--h-custom': '1.875rem',
                                                '--p-custom': '0.375rem',
                                            }}
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

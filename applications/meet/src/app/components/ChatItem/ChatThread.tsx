import { useLayoutEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectChatThreadReplyDraft,
    setChatThreadExpanded,
    setChatThreadReplyDraft,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectLocalParticipantIdentity } from '@proton/meet/store/slices/participants/participantsSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import clsx from '@proton/utils/clsx';

import { useChatMessage } from '../../hooks/bridges/useChatMessage';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import { ChatItem } from './ChatItem';

import './ChatThread.scss';

// A root taller than this fraction of the visible chat area is not pinned: pinning it would fill the
// viewport and hide the replies scrolling underneath (see ChatThread.scss for the sticky styles).
const MAX_STICKY_ROOT_HEIGHT_RATIO = 0.6;

interface ChatThreadProps {
    /** The message that starts the thread. */
    rootMessage: MeetChatMessage;
    /** Replies belonging to the thread, expected to be sorted by timestamp. */
    replies: MeetChatMessage[];
    roomName?: string;
    /**
     * The thread's root message is not available locally (e.g. it was sent before the local
     * participant joined). A placeholder is shown in place of the root message.
     */
    isRootMissing?: boolean;
}

export const ChatThread = ({ rootMessage, replies, roomName, isRootMissing = false }: ChatThreadProps) => {
    const replyCount = replies.length;

    const dispatch = useMeetDispatch();

    const expanded = rootMessage.expanded ?? false;
    // Bumped each time the user clicks reply, so the (possibly already mounted) field remounts and
    // grabs focus.
    const [replyNonce, setReplyNonce] = useState(0);

    const headerRef = useRef<HTMLDivElement>(null);
    // Roots taller than MAX_STICKY_ROOT_HEIGHT_RATIO of the chat area are excluded from pinning.
    const [isRootTooTall, setIsRootTooTall] = useState(false);

    // Compare the root header height against the visible chat area and keep it in sync as either
    // resizes, so a long root message releases from the pin line instead of hiding its replies.
    useLayoutEffect(() => {
        const header = headerRef.current;
        const container = header?.closest<HTMLElement>('.message-list');
        if (!header || !container || !expanded || !replyCount) {
            return;
        }

        const measure = () => {
            const containerHeight = container.clientHeight;
            if (containerHeight === 0) {
                return;
            }
            setIsRootTooTall(header.offsetHeight > containerHeight * MAX_STICKY_ROOT_HEIGHT_RATIO);
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(header);
        observer.observe(container);

        return () => observer.disconnect();
    }, [expanded, replyCount]);

    const { sendMessage } = useChatMessage();

    // A reply targets the root message and shares the thread's topic. Root messages of a thread use
    // their own id as the topic when none was assigned yet.
    const topicId = rootMessage.topicId ?? rootMessage.id;

    const setExpanded = (value: boolean) =>
        dispatch(setChatThreadExpanded({ messageId: rootMessage.id, expanded: value }));

    const handleReply = (message: string) =>
        sendMessage(message, {
            replyToId: rootMessage.id,
            topicId,
        });

    const handleReplyClick = () => {
        setExpanded(true);
        setReplyNonce((nonce) => nonce + 1);
    };
    const handleReplyComposerClose = () => {
        setExpanded(false);
        dispatch(setChatThreadReplyDraft({ messageId: rootMessage.id, draft: '' }));
    };

    const localParticipantIdentity = useMeetSelector(selectLocalParticipantIdentity);

    // The badge is only relevant to participants involved in the thread: the author of the root
    // message or anyone who has already replied to it.
    const isThreadParticipant =
        rootMessage.identity === localParticipantIdentity ||
        replies.some((reply) => reply.identity === localParticipantIdentity);

    const hasUnseenMessage = isThreadParticipant && replies.some((reply) => !reply.seen);

    const replyDraft = useMeetSelector((state) => selectChatThreadReplyDraft(state, rootMessage.id));
    const hasReplyDraft = replyDraft.trim() !== '';

    const threadRepliesId = `chat-thread-replies-${rootMessage.id}`;

    return (
        <div className="chat-thread">
            {/* Root + collapse toggle stick together at the top while replies scroll under them.
                A root taller than 60% of the chat area is left unpinned so it can't hide its replies. */}
            <div
                ref={headerRef}
                className={clsx(
                    'chat-thread-header',
                    expanded && replyCount > 0 && !isRootTooTall && 'chat-thread-header--sticky'
                )}
            >
                {isRootMissing ? (
                    <div className="chat-item chat-thread-missing-root flex gap-2 flex-nowrap shrink-0 mr-2 py-2 px-1 items-center">
                        <div
                            className="chat-thread-missing-root-avatar rounded-full shrink-0 w-custom h-custom"
                            style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                            aria-hidden="true"
                        />
                        <div className="color-weak text-break">
                            {c('Info').t`This conversation started before you joined.`}
                        </div>
                    </div>
                ) : (
                    <ChatItem item={rootMessage} roomName={roomName} onReply={handleReplyClick} />
                )}

                {replyCount > 0 && (
                    <div className="chat-thread-toggle-wrapper ml-custom pl-3" style={{ '--ml-custom': '1.25rem' }}>
                        <Button
                            shape="ghost"
                            size="small"
                            className="chat-thread-toggle flex items-center gap-1 text-semibold pl-0"
                            onClick={() => setExpanded(!expanded)}
                            aria-expanded={expanded}
                            aria-controls={threadRepliesId}
                        >
                            {expanded ? <IcChevronDown size={4} /> : <IcChevronRight size={4} />}
                            <span>
                                {!expanded && hasReplyDraft
                                    ? c('Info').t`1 reply draft`
                                    : `${expanded ? '' : c('Info').t`View `}${c('Info').ngettext(
                                          msgid`${replyCount} reply`,
                                          `${replyCount} replies`,
                                          replyCount
                                      )}`}
                            </span>
                            {hasUnseenMessage && (
                                <div className="new-reply-badge py-0.5 px-2 rounded-full flex items-center justify-center gap-2">
                                    <div
                                        className="new-reply-dot w-custom h-custom rounded-full bg-norm"
                                        style={{ '--w-custom': '0.375rem', '--h-custom': '0.375rem' }}
                                        aria-hidden="true"
                                    />
                                    {c('Info').t`New reply`}
                                </div>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            <div
                className={clsx(
                    'chat-thread-body ml-custom pl-3',
                    expanded ? 'chat-thread-body-open' : 'chat-thread-body-closed'
                )}
                style={{ '--ml-custom': '1.25rem' }}
            >
                <div id={threadRepliesId}>
                    {expanded && (
                        <>
                            {replies.map((reply) => (
                                <ChatItem
                                    key={`${reply.identity}-${reply.timestamp}`}
                                    item={reply}
                                    roomName={roomName}
                                    variant="thread"
                                />
                            ))}

                            <div className="chat-thread-reply px-1 py-2">
                                <ChatMessage
                                    key={replyNonce}
                                    onMessageSend={handleReply}
                                    variant="thread"
                                    autoFocus={replyNonce > 0}
                                    rootMessageId={rootMessage.id}
                                    showThreadCloseButton={replyCount === 0}
                                    onThreadClose={handleReplyComposerClose}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

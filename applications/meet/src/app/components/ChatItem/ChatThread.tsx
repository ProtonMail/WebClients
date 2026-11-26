import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectChatThreadReplyDraft,
    setChatThreadExpanded,
    setChatThreadReplyDraft,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import { isChatThreadExpanded } from '@proton/meet/utils/isChatThreadExpanded';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';
import clsx from '@proton/utils/clsx';

import { useChatMessage } from '../../hooks/bridges/useChatMessage';
import { useStableCallback } from '../../hooks/useStableCallback';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import { ChatItem } from './ChatItem';

import './ChatThread.scss';

interface ChatThreadProps {
    /** The message that starts the thread. */
    rootMessage: MeetChatMessage;
    /** Replies belonging to the thread, expected to be sorted by timestamp. */
    replies: MeetChatMessage[];
    meetingName?: string;
    /**
     * The thread's root message is not available locally (e.g. it was sent before the local
     * participant joined). A placeholder is shown in place of the root message.
     */
    isRootMissing?: boolean;
}

export const ChatThread = ({ rootMessage, replies, meetingName, isRootMissing = false }: ChatThreadProps) => {
    const replyCount = replies.length;

    const dispatch = useMeetDispatch();

    const expanded = isChatThreadExpanded(rootMessage);
    // Bumped each time the user clicks reply, so the (possibly already mounted) field remounts and
    // grabs focus.
    const [replyNonce, setReplyNonce] = useState(0);

    const { information } = useTheme();
    const isMotionReduced = information.motionMode === MotionModeSetting.Reduce || information.features.animations;

    const replyFieldRef = useRef<HTMLDivElement>(null);
    const scrollReplyFieldIntoView = useStableCallback(() =>
        replyFieldRef.current?.scrollIntoView({ block: 'nearest', behavior: isMotionReduced ? 'auto' : 'smooth' })
    );

    // Focusing the opened field only brings the input itself into view: show the whole field, with as much of the
    // thread above it as fits. The browser scrolls to the focused input after this effect, which would cancel a
    // scroll started in the same frame.
    useEffect(() => {
        if (replyNonce === 0) {
            return;
        }
        const frame = requestAnimationFrame(scrollReplyFieldIntoView);
        return () => cancelAnimationFrame(frame);
    }, [replyNonce, scrollReplyFieldIntoView]);

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
        setReplyNonce(0);
        dispatch(setChatThreadReplyDraft({ messageId: rootMessage.id, draft: '' }));
    };

    // A collapsed thread hides its replies, so it carries a badge for the ones that were never
    // revealed. Expanding the thread marks them as seen.
    const hasUnseenMessage = !expanded && replies.some((reply) => !reply.seen);

    const replyDraft = useMeetSelector((state) => selectChatThreadReplyDraft(state, rootMessage.id));
    const hasReplyDraft = replyDraft.trim() !== '';

    // An expanded thread without replies would otherwise show a reply composer under every message:
    // the composer only opens once the participant asks for it or has a draft waiting.
    const showThreadBody = expanded && (replyCount > 0 || replyNonce > 0 || hasReplyDraft);

    const threadRepliesId = `chat-thread-replies-${rootMessage.id}`;

    return (
        <div className="chat-thread">
            <div className="chat-thread-header">
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
                    <ChatItem item={rootMessage} meetingName={meetingName} onReply={handleReplyClick} />
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
                    showThreadBody ? 'chat-thread-body-open' : 'chat-thread-body-closed'
                )}
                style={{ '--ml-custom': '1.25rem' }}
            >
                <div id={threadRepliesId}>
                    {showThreadBody && (
                        <>
                            {replies.map((reply) => (
                                <ChatItem
                                    key={`${reply.identity}-${reply.timestamp}`}
                                    item={reply}
                                    meetingName={meetingName}
                                    variant="thread"
                                />
                            ))}

                            <div ref={replyFieldRef} className="chat-thread-reply px-1 py-2">
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

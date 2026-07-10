import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { markChatMessagesAsSeen } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectRoomName } from '@proton/meet/store/slices/meetingInfo';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import placeholder from '@proton/styles/assets/img/meet/chat-empty-state.png';
import placeholderSearch from '@proton/styles/assets/img/meet/search-empty-state.png';
import { useFlag } from '@proton/unleash/useFlag';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SideBar } from '../../atoms/SideBar/SideBar';
import { useChatMessage } from '../../hooks/bridges/useChatMessage';
import { useChatMessageListNavigation } from '../../hooks/useChatMessageListNavigation';
import { useMeetingRoomUpdates } from '../../hooks/useMeetingRoomUpdates';
import { ChatItem } from '../ChatItem/ChatItem';
import { ChatThread } from '../ChatItem/ChatThread';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import { SideBarSearch } from '../SideBarSearch/SideBarSearch';
import { NewMessagePill } from './NewMessagePill';

import './Chat.scss';

export const Chat = () => {
    const dispatch = useMeetDispatch();
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const [isScrolled, setIsScrolled] = useState(false);

    const [newMessageCount, setNewMessageCount] = useState(0);

    // Whether a thread root is pinned at the top; drives the opaque header (see below).
    const [hasStuckThread, setHasStuckThread] = useState(false);

    const roomName = useMeetSelector(selectRoomName);

    const isChatThreadsEnabled = useFlag('MeetChatThreads');

    const sideBarState = useMeetSelector(selectSideBarState);

    const isChatOpen = sideBarState[MeetingSideBars.Chat];

    const meetingRoomUpdates = useMeetingRoomUpdates();

    const { sendMessage } = useChatMessage();

    const { navigationProps: messageListNavigationProps } = useChatMessageListNavigation<HTMLUListElement>();

    const scrollRef = useRef<HTMLDivElement>(null);
    const wasAtBottomRef = useRef(true);
    const prevMessageCountRef = useRef(0);
    const prevMainChatCountRef = useRef(0);

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        wasAtBottomRef.current = true;
        setNewMessageCount(0);
    };

    // A root is pinned when it rests at the pin line (below the header) with its thread still below.
    const updateStuckThreadState = useCallback(() => {
        const container = scrollRef.current;
        if (!container) {
            return;
        }

        const stickyHeaders = container.querySelectorAll<HTMLElement>('.chat-thread-header--sticky');
        if (stickyHeaders.length === 0) {
            setHasStuckThread(false);
            return;
        }

        const containerTop = container.getBoundingClientRect().top;
        const headerHeight = parseFloat(getComputedStyle(container).getPropertyValue('--side-bar-header-height')) || 0;
        const pinLine = containerTop + headerHeight;

        let stuck = false;
        stickyHeaders.forEach((header) => {
            const rect = header.getBoundingClientRect();
            if (rect.top <= pinLine + 1 && rect.bottom > pinLine) {
                stuck = true;
            }
        });

        setHasStuckThread(stuck);
    }, []);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(event.currentTarget.scrollTop > 0);

        updateStuckThreadState();

        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
        wasAtBottomRef.current = isAtBottom;

        // Scrolling back to the bottom clears the pill.
        if (isAtBottom) {
            setNewMessageCount(0);
        }
    };

    // Handle scroll to bottom when chat opens or receiving new updates
    useEffect(() => {
        const mainChatMessageCount = meetingRoomUpdates.filter((item) => {
            if (item.type !== 'message') {
                return false;
            }
            const message = item as MeetChatMessage;
            return !message.topicId || message.topicId === message.id;
        }).length;

        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const messageCount = meetingRoomUpdates.length;
        const prevCount = prevMessageCountRef.current;
        const mainChatDelta = mainChatMessageCount - prevMainChatCountRef.current;

        if (messageCount > prevCount) {
            if (wasAtBottomRef.current) {
                el.scrollTop = el.scrollHeight;
            } else if (mainChatDelta > 0) {
                setNewMessageCount((count) => count + mainChatDelta);
            }
        }
        prevMessageCountRef.current = messageCount;
        prevMainChatCountRef.current = mainChatMessageCount;
        // Running this effect if the length of updates changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetingRoomUpdates.length]);

    // Handle marking messages as seen
    useEffect(() => {
        if (isChatOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            wasAtBottomRef.current = true;
            setNewMessageCount(0);
        }

        if (isChatOpen) {
            dispatch(markChatMessagesAsSeen());
        }
    }, [isChatOpen, dispatch]);

    const lowerCaseSearchExpression = searchExpression.toLowerCase();

    const filteredMeetingRoomUpdates =
        !isSearchOn || !searchExpression
            ? meetingRoomUpdates
            : meetingRoomUpdates.filter((item) =>
                  (item as MeetChatMessage)?.message?.toLowerCase().includes(lowerCaseSearchExpression)
              );

    // Group thread replies under their root message. A reply carries the thread `topicId` (which
    // points at the root message id) and is therefore rendered inside the root's thread rather than
    // as a standalone top-level entry. Threading is skipped while searching so no result is hidden.
    const threadView = useMemo(() => {
        const repliesByTopic = new Map<string, MeetChatMessage[]>();
        const replyIds = new Set<string>();

        for (const item of filteredMeetingRoomUpdates) {
            if (item.type === 'message') {
                const message = item as MeetChatMessage;
                if (message.topicId && message.topicId !== message.id) {
                    const replies = repliesByTopic.get(message.topicId) ?? [];
                    replies.push(message);
                    repliesByTopic.set(message.topicId, replies);
                    replyIds.add(message.id);
                }
            }
        }

        return filteredMeetingRoomUpdates
            .filter((item) => !(item.type === 'message' && replyIds.has((item as MeetChatMessage).id)))
            .map((item) => {
                if (item.type === 'message') {
                    const message = item as MeetChatMessage;
                    return {
                        root: message,
                        replies: repliesByTopic.get(message.id) ?? [],
                        isRootMissing: message.isMissingRoot,
                    };
                }

                return { root: item, replies: [] as MeetChatMessage[], isRootMissing: false };
            });
    }, [filteredMeetingRoomUpdates]);

    // Recompute after layout changes and resize (no scroll event fires for those).
    useEffect(() => {
        updateStuckThreadState();
    }, [threadView, isChatOpen, updateStuckThreadState]);

    useEffect(() => {
        window.addEventListener('resize', updateStuckThreadState);
        return () => window.removeEventListener('resize', updateStuckThreadState);
    }, [updateStuckThreadState]);

    const hasNoMessages = !meetingRoomUpdates.length;

    if (!isChatOpen) {
        return null;
    }

    return (
        <SideBar
            onClose={() => dispatch(toggleSideBarState(MeetingSideBars.Chat))}
            aria-label={c('Aria').t`Chat`}
            absoluteHeader={true}
            isScrolled={isScrolled}
            paddingClassName="py-4"
            paddingHeaderClassName={hasStuckThread ? 'chat-panel-header' : ''}
            header={
                <div className="flex items-center">
                    {!isSearchOn && (
                        <div className="text-semibold flex items-center">
                            <SecurityShield title={c('Info').t`End-to-end encryption is active for this chat.`} />

                            <h2 className="text-semibold text-3xl m-0">{c('Title').t`Chat`}</h2>
                            <Button
                                className="search-open-button p-0 ml-2 flex items-center justify-center"
                                shape="ghost"
                                size="small"
                                onClick={() => setIsSearchOn(!isSearchOn)}
                                aria-label={c('Alt').t`Open chat message search`}
                            >
                                <IcMagnifier size={6} />
                            </Button>
                        </div>
                    )}
                    {isSearchOn && (
                        <SideBarSearch
                            searchExpression={searchExpression}
                            setSearchExpression={setSearchExpression}
                            setIsSearchOn={setIsSearchOn}
                            placeholder={c('Placeholder').t`Find...`}
                        />
                    )}
                </div>
            }
        >
            <section
                ref={scrollRef}
                className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap pb-4 px-4 message-list"
                onScroll={handleScroll}
            >
                {!isSearchOn && hasNoMessages && (
                    <div
                        className="flex flex-column items-center justify-center my-auto mx-auto w-custom"
                        style={{ width: '12.8125rem' }}
                    >
                        <img
                            className="w-custom h-custom mb-2"
                            src={placeholder}
                            alt=""
                            style={{ '--w-custom': '3rem', '--h-custom': '3rem' }}
                        />
                        <div className="text-center color-disabled">
                            {c('Info')
                                .t`This is an end to end encrypted chat with ephemeral messages, which disappear at the end of the call.`}
                        </div>
                    </div>
                )}
                {isSearchOn && filteredMeetingRoomUpdates.length === 0 && (
                    <div
                        className="flex flex-column items-center justify-center my-auto mx-auto w-custom"
                        style={{ width: '12.8125rem' }}
                    >
                        <img
                            className="w-custom h-custom mb-2"
                            src={placeholderSearch}
                            alt=""
                            style={{ '--w-custom': '3rem', '--h-custom': '3rem' }}
                        />
                        <div className="text-center color-disabled">{c('Info').t`No search results`}</div>
                    </div>
                )}
                {/* Messages already announced by the centralized announcer */}
                <ul
                    {...messageListNavigationProps}
                    className="unstyled m-0 p-0"
                    aria-label={c('Aria').t`Chat messages`}
                >
                    {isSearchOn || !isChatThreadsEnabled
                        ? filteredMeetingRoomUpdates.map((item) => (
                              <li key={`${item.identity}-${item.timestamp}`}>
                                  <ChatItem item={item} roomName={roomName} />
                              </li>
                          ))
                        : threadView.map(({ root, replies, isRootMissing }) => (
                              <li key={`${root.identity}-${root.timestamp}`}>
                                  {root.type === 'message' ? (
                                      <ChatThread
                                          rootMessage={root as MeetChatMessage}
                                          replies={replies}
                                          roomName={roomName}
                                          isRootMissing={isRootMissing}
                                      />
                                  ) : (
                                      <ChatItem item={root} roomName={roomName} />
                                  )}
                              </li>
                          ))}
                </ul>
            </section>
            <div className="relative">
                {!isSearchOn && newMessageCount > 0 && (
                    <div
                        className="absolute bottom-custom left-0 right-0 flex justify-center"
                        style={{ '--bottom-custom': '100%' }}
                    >
                        <NewMessagePill
                            newMessageCount={newMessageCount}
                            onScrollToBottom={scrollToBottom}
                            onDismiss={() => setNewMessageCount(0)}
                        />
                    </div>
                )}
                <ChatMessage onMessageSend={sendMessage} />
            </div>
        </SideBar>
    );
};

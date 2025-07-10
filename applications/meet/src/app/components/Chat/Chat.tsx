import { useEffect, useMemo, useRef, useState } from 'react';

import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcMagnifier } from '@proton/icons';

import placeholder from '../../../assets/chat-empty-state.png';
import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useChatMessage } from '../../hooks/useChatMessage';
import { useMeetingRoomUpdates } from '../../hooks/useMeetingRoomUpdates';
import { useSortedParticipants } from '../../hooks/useSortedParticipants';
import type { MeetChatMessage } from '../../types';
import { MeetingSideBars } from '../../types';
import { getParticipantDisplayColors } from '../../utils/getParticipantDisplayColors';
import { ChatItem } from '../ChatItem/ChatItem';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import { SideBarSearch } from '../SideBarSearch/SideBarSearch';

import './Chat.scss';

export const Chat = () => {
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const { roomName, setChatMessages } = useMeetContext();

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    const meetingRoomUpdates = useMeetingRoomUpdates();

    const { sortedParticipants } = useSortedParticipants();

    const sendMessage = useChatMessage();

    const scrollRef = useRef<HTMLDivElement>(null);
    const wasAtBottomRef = useRef(true);
    const prevMessageCountRef = useRef(0);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const messageCount = meetingRoomUpdates.length;
        const prevCount = prevMessageCountRef.current;

        if (messageCount > prevCount && wasAtBottomRef.current) {
            el.scrollTop = el.scrollHeight;
        }
        prevMessageCountRef.current = messageCount;
    }, [meetingRoomUpdates]);

    useEffect(() => {
        if (sideBarState[MeetingSideBars.Chat] && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        if (sideBarState[MeetingSideBars.Chat]) {
            setChatMessages((prev) =>
                prev.map((item) => ({
                    ...item,
                    seen: true,
                }))
            );
        }
    }, [sideBarState[MeetingSideBars.Chat]]);

    const colors = useMemo(() => {
        return meetingRoomUpdates.map((item) =>
            getParticipantDisplayColors(
                sortedParticipants.find((p) => p.identity === item.identity) as LocalParticipant | RemoteParticipant
            )
        );
    }, [meetingRoomUpdates, sortedParticipants]);

    const filteredMeetingRoomUpdates = useMemo(() => {
        if (!isSearchOn || !searchExpression) {
            return meetingRoomUpdates;
        }
        return meetingRoomUpdates.filter((item) =>
            (item as MeetChatMessage)?.message?.toLowerCase().includes(searchExpression.toLowerCase())
        );
    }, [isSearchOn, searchExpression, meetingRoomUpdates]);

    const hasNoMessages = !meetingRoomUpdates.length;

    if (!sideBarState[MeetingSideBars.Chat]) {
        return null;
    }

    return (
        <SideBar onClose={() => toggleSideBarState(MeetingSideBars.Chat)}>
            <div className="absolute top-0 left-0 w-full px-4 pt-4 pb-0 bg-norm rounded-xl" style={{ opacity: 0.9 }}>
                {!isSearchOn && (
                    <div className="mb-4 h3 text-semibold flex items-center">
                        <SecurityShield
                            title={c('l10n_nightly Info').t`End-to-end encryption is active for this chat.`}
                        />

                        {c('l10n_nightly Title').t`Chat`}
                        <Button
                            className="p-0 ml-2 flex items-center justify-center"
                            shape="ghost"
                            size="small"
                            onClick={() => setIsSearchOn(!isSearchOn)}
                            aria-label={c('l10n_nightly Alt').t`Open chat message search`}
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
                        placeholder={c('l10n_nightly Placeholder').t`Search messages`}
                    />
                )}
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 h-full message-list"
                onScroll={handleScroll}
            >
                {hasNoMessages && (
                    <div
                        className="flex flex-column items-center justify-center my-auto mx-auto w-custom"
                        style={{ width: '12.8125rem' }}
                    >
                        <img
                            className="w-custom h-custom"
                            src={placeholder}
                            alt=""
                            style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                        />
                        <div className="text-center color-weak">
                            {c('l10n_nightly Info').t`Only people in this call can read what you send.`}
                        </div>
                    </div>
                )}
                {filteredMeetingRoomUpdates.map((item, index) => (
                    <ChatItem
                        key={`${item.identity}-${item.timestamp}`}
                        item={item}
                        roomName={roomName}
                        colors={colors[index]}
                    />
                ))}
            </div>
            <ChatMessage onMessageSend={sendMessage} />
        </SideBar>
    );
};

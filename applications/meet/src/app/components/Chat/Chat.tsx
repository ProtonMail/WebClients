import { useEffect, useMemo, useRef, useState } from 'react';

import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { c } from 'ttag';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useChatMessage } from '../../hooks/useChatMessage';
import { useMeetingRoomUpdates } from '../../hooks/useMeetingRoomUpdates';
import { useSortedParticipants } from '../../hooks/useSortedParticipants';
import { MeetingSideBars } from '../../types';
import { getParticipantDisplayColors } from '../../utils/getParticipantDisplayColors';
import { ChatItem } from '../ChatItem/ChatItem';
import { ChatMessage } from '../ChatMessage/ChatMessage';

import './Chat.scss';

export const Chat = () => {
    const [message, setMessage] = useState('');

    const { sideBarState, roomName, setChatMessages } = useMeetContext();

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
        return meetingRoomUpdates.map(
            (item) =>
                getParticipantDisplayColors(
                    sortedParticipants.find((p) => p.identity === item.identity) as LocalParticipant | RemoteParticipant
                ).profileColor
        );
    }, [meetingRoomUpdates, sortedParticipants]);

    if (!sideBarState[MeetingSideBars.Chat]) {
        return null;
    }

    return (
        <SideBar>
            <div className="absolute top-0 left-0 w-full px-4 pt-4 pb-0 bg-norm rounded-xl" style={{ opacity: 0.9 }}>
                <div className="mb-4 h3">{c('Meet').t`Meeting Chat`}</div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 h-full message-list"
                onScroll={handleScroll}
            >
                {meetingRoomUpdates.map((item, index) => (
                    <ChatItem
                        key={`${item.identity}-${item.timestamp}`}
                        item={item}
                        roomName={roomName}
                        colorClassName={colors[index]}
                    />
                ))}
            </div>
            <ChatMessage message={message} onMessageChange={setMessage} onMessageSend={sendMessage} />
        </SideBar>
    );
};

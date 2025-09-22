import { useEffect, useRef, useState } from 'react';

import type { LocalParticipant, RemoteParticipant } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcMagnifier } from '@proton/icons';
import placeholder from '@proton/styles/assets/img/meet/chat-empty-state.png';
import placeholderSearch from '@proton/styles/assets/img/meet/search-empty-state.png';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useChatMessage } from '../../hooks/useChatMessage';
import { useMeetingRoomUpdates } from '../../hooks/useMeetingRoomUpdates';
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

    const [isScrolled, setIsScrolled] = useState(false);

    const { roomName, setChatMessages } = useMeetContext();

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    const meetingRoomUpdates = useMeetingRoomUpdates();

    const { sortedParticipants } = useMeetContext();

    const sendMessage = useChatMessage();

    const scrollRef = useRef<HTMLDivElement>(null);
    const wasAtBottomRef = useRef(true);
    const prevMessageCountRef = useRef(0);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(event.currentTarget.scrollTop > 0);

        const el = scrollRef.current;
        if (!el) {
            return;
        }
        wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
    };

    // Handle scroll to bottom when chat opens or receiving new updates
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
    }, [meetingRoomUpdates.length]);

    // Handle marking messages as seen
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

    const colors = meetingRoomUpdates.map((item) =>
        getParticipantDisplayColors(
            sortedParticipants.find((p) => p.identity === item.identity) as LocalParticipant | RemoteParticipant
        )
    );

    const lowerCaseSearchExpression = searchExpression.toLowerCase();

    const filteredMeetingRoomUpdates =
        !isSearchOn || !searchExpression
            ? meetingRoomUpdates
            : meetingRoomUpdates.filter((item) =>
                  (item as MeetChatMessage)?.message?.toLowerCase().includes(lowerCaseSearchExpression)
              );

    const hasNoMessages = !meetingRoomUpdates.length;

    if (!sideBarState[MeetingSideBars.Chat]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => toggleSideBarState(MeetingSideBars.Chat)}
            absoluteHeader={true}
            isScrolled={isScrolled}
            header={
                <div className="flex items-center">
                    {!isSearchOn && (
                        <div className="text-semibold flex items-center">
                            <SecurityShield title={c('Info').t`End-to-end encryption is active for this chat.`} />

                            <div className="text-semibold text-3xl">{c('Title').t`Chat`}</div>
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
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 message-list"
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
                                .t`This is an end-to-end encrypted chat with ephemeral messages. After you leave the call, you will not be able to access this chat.`}
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

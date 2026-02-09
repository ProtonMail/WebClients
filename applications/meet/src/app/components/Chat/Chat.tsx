import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { markChatMessagesAsSeen } from '@proton/meet/store/slices/meetingState';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import placeholder from '@proton/styles/assets/img/meet/chat-empty-state.png';
import placeholderSearch from '@proton/styles/assets/img/meet/search-empty-state.png';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useSortedParticipantsContext } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useChatMessage } from '../../hooks/bridges/useChatMessage';
import { useMeetingRoomUpdates } from '../../hooks/useMeetingRoomUpdates';
import { ChatItem } from '../ChatItem/ChatItem';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import { SideBarSearch } from '../SideBarSearch/SideBarSearch';

import './Chat.scss';

export const Chat = () => {
    const dispatch = useMeetDispatch();
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const [isScrolled, setIsScrolled] = useState(false);

    const { roomName } = useMeetContext();

    const sideBarState = useMeetSelector(selectSideBarState);

    const meetingRoomUpdates = useMeetingRoomUpdates();

    const { sortedParticipantsDisplayColorsMap } = useSortedParticipantsContext();

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
            dispatch(markChatMessagesAsSeen());
        }
    }, [sideBarState[MeetingSideBars.Chat]]);

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
            onClose={() => dispatch(toggleSideBarState(MeetingSideBars.Chat))}
            absoluteHeader={true}
            isScrolled={isScrolled}
            paddingClassName="py-4"
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
                className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 pb-4 px-4 message-list"
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
                {filteredMeetingRoomUpdates.map((item) => (
                    <ChatItem
                        key={`${item.identity}-${item.timestamp}`}
                        item={item}
                        roomName={roomName}
                        colors={
                            sortedParticipantsDisplayColorsMap.get(item.identity) ?? {
                                backgroundColor: 'meet-background-1',
                                profileTextColor: 'profile-color-1',
                            }
                        }
                    />
                ))}
            </div>
            <ChatMessage onMessageSend={sendMessage} />
        </SideBar>
    );
};

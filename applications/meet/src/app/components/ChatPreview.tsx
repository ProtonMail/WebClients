import { useEffect, useMemo, useRef } from 'react';

import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import { CloseButton } from '../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { useSortedParticipants } from '../hooks/useSortedParticipants';
import type { MeetChatMessage } from '../types';
import { MeetingSideBars } from '../types';
import { getParticipantDisplayColors } from '../utils/getParticipantDisplayColors';
import { ChatItem } from './ChatItem/ChatItem';

const CHAT_MESSAGE_TIMEOUT = 8000;

export const ChatPreview = () => {
    const { chatMessages, setChatMessages } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const latestChatMessage = useMemo(() => {
        const item = chatMessages.sort((a, b) => b.timestamp - a.timestamp)[0];

        return item ? { ...item, type: 'message' as const } : null;
    }, [chatMessages]);

    const { sortedParticipants } = useSortedParticipants();

    const toggleChatPreview = () => {
        setChatMessages(
            chatMessages.map((item) => ({
                ...item,
                seen: (item as MeetChatMessage).id === latestChatMessage?.id ? true : item.seen,
            }))
        );
    };

    const shouldNotDisplayLastMessage =
        !latestChatMessage || sideBarState[MeetingSideBars.Chat] || latestChatMessage.seen;

    useEffect(() => {
        if (!latestChatMessage) {
            return;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setChatMessages(
                chatMessages.map((item) =>
                    item.id !== latestChatMessage.id
                        ? item
                        : {
                              ...item,
                              seen: true,
                          }
                )
            );
        }, CHAT_MESSAGE_TIMEOUT);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [chatMessages, latestChatMessage]);

    if (shouldNotDisplayLastMessage) {
        return null;
    }

    return (
        <div
            className="absolute bottom-custom left-custom z-up bg-norm border border-norm rounded-xl p-4 w-custom max-w-custom max-h-custom flex flex-nowrap justify-space-between items-center overflow-y-auto"
            style={{
                '--bottom-custom': '4.5rem',
                '--left-custom': '50%',
                '--w-custom': '20rem',
                '--max-w-custom': '20rem',
                '--max-h-custom': '8rem',
                transform: 'translateX(-50%)',
            }}
        >
            <ChatItem
                item={latestChatMessage}
                colors={getParticipantDisplayColors(
                    sortedParticipants.find((p) => p.identity === latestChatMessage.identity) as
                        | RemoteParticipant
                        | LocalParticipant
                )}
                displayDate={false}
                shouldGrow={true}
            />

            <CloseButton onClose={toggleChatPreview} className="ml-auto" />
        </div>
    );
};

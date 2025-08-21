import { useEffect, useMemo, useState } from 'react';

import type { LocalParticipant, RemoteParticipant } from '@proton-meet/livekit-client';

import { CloseButton } from '../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import type { MeetChatMessage } from '../types';
import { MeetingSideBars } from '../types';
import { getParticipantDisplayColors } from '../utils/getParticipantDisplayColors';
import { ChatItem } from './ChatItem/ChatItem';

const CHAT_MESSAGE_TIMEOUT = 8000;

export const ChatPreview = () => {
    const [isOpen, setIsOpen] = useState(false);

    const { chatMessages, setChatMessages, sortedParticipants } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const latestChatMessage = useMemo(() => {
        const item = chatMessages.sort((a, b) => b.timestamp - a.timestamp)[0];

        return item ? { ...item, type: 'message' as const } : null;
    }, [chatMessages]);

    const isLargerThanMd = useIsLargerThanMd();

    const toggleChatPreview = () => {
        setChatMessages(
            chatMessages.map((item) => ({
                ...item,
                seen: (item as MeetChatMessage).id === latestChatMessage?.id ? true : item.seen,
            }))
        );
    };

    const shouldNotDisplayLastMessage = !isOpen || sideBarState[MeetingSideBars.Chat] || !latestChatMessage;

    useEffect(() => {
        if (latestChatMessage && !sideBarState[MeetingSideBars.Chat]) {
            setIsOpen(true);
        }

        const timeoutId = setTimeout(() => {
            setIsOpen(false);
        }, CHAT_MESSAGE_TIMEOUT);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [latestChatMessage]);

    if (shouldNotDisplayLastMessage || !isLargerThanMd) {
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

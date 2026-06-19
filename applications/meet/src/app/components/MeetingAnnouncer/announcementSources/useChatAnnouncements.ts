import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessages } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';
import { selectLocalParticipantIdentity } from '@proton/meet/store/slices/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState } from '@proton/meet/store/slices/uiStateSlice';

import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

export const useChatAnnouncements = () => {
    const announce = useAnnounce();

    const chatMessages = useMeetSelector(selectChatMessages);
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);
    const localIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const sideBarState = useMeetSelector(selectSideBarState);
    const isChatOpen = sideBarState[MeetingSideBars.Chat];

    // null until first run so existing messages are not re-announced on mount.
    const processedCountRef = useRef<number | null>(null);

    useEffect(() => {
        if (processedCountRef.current === null) {
            processedCountRef.current = chatMessages.length;
            return;
        }

        const newMessages = chatMessages.slice(processedCountRef.current);
        processedCountRef.current = chatMessages.length;

        if (isChatOpen) {
            return;
        }

        for (const message of newMessages) {
            if (message.identity === localIdentity) {
                continue;
            }

            announce(announcementMessages.newChatMessage(message.message, nameMap[message.identity]), {
                dedupeKey: `chat-${message.id}`,
            });
        }
    }, [chatMessages, nameMap, localIdentity, isChatOpen, announce]);
};

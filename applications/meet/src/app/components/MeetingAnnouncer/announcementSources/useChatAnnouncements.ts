import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessages } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    selectLocalParticipantIdentity,
    selectParticipantDecryptedNameMap,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { isRelevantThreadMessage } from '@proton/meet/utils/isRelevantThreadMessage';
import { isParticipantMentioned } from '@proton/meet/utils/mentions/mentionToken';
import { useFlag } from '@proton/unleash/useFlag';

import { useMentionPlainText } from '../../../hooks/useMentionPlainText';
import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

export const useChatAnnouncements = () => {
    const announce = useAnnounce();

    const chatMessages = useMeetSelector(selectChatMessages);
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);
    const localIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const toMentionPlainText = useMentionPlainText();
    const isMentionsEnabled = useFlag('MeetChatMentions');

    // Skip pre-mount messages.
    const processedCountRef = useRef<number | null>(null);

    useEffect(() => {
        if (processedCountRef.current === null) {
            processedCountRef.current = chatMessages.length;
            return;
        }

        const newMessages = chatMessages.slice(processedCountRef.current);
        processedCountRef.current = chatMessages.length;

        for (const message of newMessages) {
            if (message.identity === localIdentity) {
                continue;
            }

            const isMentioned = isMentionsEnabled && isParticipantMentioned(message.message, localIdentity);

            if (
                message.isMissingRoot ||
                (!isMentioned && !isRelevantThreadMessage(message, chatMessages, localIdentity))
            ) {
                continue;
            }

            const plainTextMessage = toMentionPlainText(message.message);
            const senderName = nameMap[message.identity];

            announce(
                isMentioned
                    ? announcementMessages.mentionedYou(plainTextMessage, senderName)
                    : announcementMessages.newChatMessage(plainTextMessage, senderName),
                {
                    dedupeKey: `chat-${message.id}`,
                }
            );
        }
    }, [chatMessages, nameMap, localIdentity, announce, toMentionPlainText, isMentionsEnabled]);
};

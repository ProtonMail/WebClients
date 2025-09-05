import { useEffect, useState } from 'react';

import type { LocalParticipant, RemoteParticipant } from '@proton-meet/livekit-client';

import { CloseButton } from '../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useMeetingRoomUpdates } from '../hooks/useMeetingRoomUpdates';
import { MeetingSideBars } from '../types';
import { getParticipantDisplayColors } from '../utils/getParticipantDisplayColors';
import { ChatItem } from './ChatItem/ChatItem';

const CHAT_MESSAGE_TIMEOUT = 8000;

const PARTICIPANT_COUNT_THRESHOLD = 5;

export const ChatPreview = () => {
    const [isOpen, setIsOpen] = useState(false);

    const { sortedParticipants, roomName } = useMeetContext();

    const meetingRoomUpdates = useMeetingRoomUpdates();

    const { sideBarState } = useUIStateContext();

    const participantCountBiggerThanThreshold = sortedParticipants.length > PARTICIPANT_COUNT_THRESHOLD;

    const now = Date.now();

    const latestMeetingRoomUpdate = meetingRoomUpdates
        .filter(
            (item) =>
                (item.type === 'message' || !participantCountBiggerThanThreshold) &&
                now - item.timestamp < CHAT_MESSAGE_TIMEOUT
        )
        .sort((a, b) => b.timestamp - a.timestamp)[0];

    const pseudoId = `${latestMeetingRoomUpdate?.identity}${latestMeetingRoomUpdate?.timestamp}${latestMeetingRoomUpdate?.type}`;

    const isLargerThanMd = useIsLargerThanMd();

    const shouldNotDisplayLastMessage = !isOpen || sideBarState[MeetingSideBars.Chat] || !latestMeetingRoomUpdate;

    // We always show the latest meeting room update (message or participant event), had to make it disappear after a timeout
    useEffect(() => {
        if (latestMeetingRoomUpdate && !sideBarState[MeetingSideBars.Chat]) {
            setIsOpen(true);
        }

        const timeoutId = setTimeout(() => {
            setIsOpen(false);
        }, CHAT_MESSAGE_TIMEOUT);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [pseudoId]);

    if (shouldNotDisplayLastMessage || !isLargerThanMd) {
        return null;
    }

    return (
        <div
            className="absolute bottom-custom left-custom z-up bg-norm border border-norm rounded-xl p-4 w-custom max-w-custom max-h-custom flex flex-nowrap justify-space-between items-center overflow-hidden"
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
                item={latestMeetingRoomUpdate}
                colors={getParticipantDisplayColors(
                    sortedParticipants.find((p) => p.identity === latestMeetingRoomUpdate.identity) as
                        | RemoteParticipant
                        | LocalParticipant
                )}
                displayDate={false}
                shouldGrow={false}
                roomName={roomName}
                ellipsisOverflow={true}
            />

            <CloseButton onClose={() => setIsOpen(false)} className="ml-auto" />
        </div>
    );
};

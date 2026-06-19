import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectEvents } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';
import { ParticipantEvent } from '@proton/meet/types/types';

import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

export const useParticipantAnnouncements = () => {
    const announce = useAnnounce();

    const events = useMeetSelector(selectEvents);
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    // null until first run so events present before mount are not re-announced.
    const baselineRef = useRef<number | null>(null);
    // Tracks events already announced so deferred joins are not re-announced once the name resolves.
    const announcedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (baselineRef.current === null) {
            baselineRef.current = events.length;
            return;
        }

        for (const event of events.slice(baselineRef.current)) {
            const key = `participant-${event.eventType}-${event.identity}-${event.timestamp}`;
            if (announcedRef.current.has(key)) {
                continue;
            }

            const name = nameMap[event.identity];

            // Joins fire before the display name is decrypted; wait for it so we can
            // announce the participant by name rather than the generic fallback. The effect
            // re-runs when nameMap updates, announcing the pending join as soon as it resolves.
            if (event.eventType === ParticipantEvent.Join && !name) {
                continue;
            }

            const message =
                event.eventType === ParticipantEvent.Join
                    ? announcementMessages.participantJoined(name)
                    : announcementMessages.participantLeft(name);

            announce(message, { dedupeKey: key });
            announcedRef.current.add(key);
        }
    }, [events, nameMap, announce]);
};

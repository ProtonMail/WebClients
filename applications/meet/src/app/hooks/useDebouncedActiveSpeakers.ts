import { useEffect, useRef, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { type Participant, RoomEvent } from 'livekit-client';

interface ActiveSpeakerSnapshot {
    timestamp: number;
    participantIds: string[];
}

const FREQ_THRESHOLD = 2;

export function useDebouncedActiveSpeakers(delayMs = 1000) {
    const room = useRoomContext();

    const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);

    const previousActiveSpeakerSnapshots = useRef<ActiveSpeakerSnapshot[]>([]);

    const prevActiveSpeakerIdentities = useRef<string[]>([]);

    useEffect(() => {
        if (!room) {
            return;
        }

        const handleActiveSpeakersChanged = (currentActiveSpeakers: Participant[]) => {
            const currentTimestamp = Date.now();
            previousActiveSpeakerSnapshots.current = previousActiveSpeakerSnapshots.current.filter(
                (snapshot) => currentTimestamp - snapshot.timestamp < delayMs
            );

            // Add current snapshot for frequency tracking
            previousActiveSpeakerSnapshots.current.push({
                timestamp: currentTimestamp,
                participantIds: currentActiveSpeakers.map((p) => p.identity),
            });

            if (
                previousActiveSpeakerSnapshots.current.length === 1 &&
                currentActiveSpeakers.filter((p) => !prevActiveSpeakerIdentities.current.includes(p.identity)).length >
                    0
            ) {
                setActiveSpeakers(currentActiveSpeakers);
                prevActiveSpeakerIdentities.current = currentActiveSpeakers.map((p) => p.identity);
                return;
            }

            const participantIdsWithFrequency = Object.fromEntries(
                currentActiveSpeakers.map((p) => [
                    p.identity,
                    previousActiveSpeakerSnapshots.current.filter((snapshot) =>
                        snapshot.participantIds.includes(p.identity)
                    ).length,
                ])
            );

            const filteredActiveSpeakers = currentActiveSpeakers.filter(
                (p) => participantIdsWithFrequency[p.identity] >= FREQ_THRESHOLD
            );

            if (
                filteredActiveSpeakers.filter((p) => !prevActiveSpeakerIdentities.current.includes(p.identity))
                    .length === 0
            ) {
                return;
            }

            setActiveSpeakers(filteredActiveSpeakers);

            prevActiveSpeakerIdentities.current = filteredActiveSpeakers.map((p) => p.identity);
        };

        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        };
    }, [room]);

    return activeSpeakers;
}

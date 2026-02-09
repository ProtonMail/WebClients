import { useEffect, useRef, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { type Participant, RoomEvent } from 'livekit-client';

import { useStableCallback } from './useStableCallback';

export function useDebouncedActiveSpeakers(delayMs = 1000) {
    const room = useRoomContext();

    const [activeSpeakers, setActiveSpeakers] = useState<Map<string, Participant>>(new Map());

    const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const handleActiveSpeakersChanged = useStableCallback((currentActiveSpeakers: Participant[]) => {
        const newActiveSpeakers = new Map<string, Participant>();

        currentActiveSpeakers.forEach((participant) => {
            const identity = participant.identity;

            const existingTimeout = timeoutsRef.current.get(identity);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            newActiveSpeakers.set(identity, participant);

            const timeout = setTimeout(() => {
                setActiveSpeakers((currentMap) => {
                    const updatedMap = new Map(currentMap);
                    updatedMap.delete(identity);
                    return updatedMap;
                });
                timeoutsRef.current.delete(identity);
            }, delayMs);

            timeoutsRef.current.set(identity, timeout);
        });

        setActiveSpeakers((prevMap) => {
            const combinedMap = new Map(prevMap);
            newActiveSpeakers.forEach((participant, identity) => {
                combinedMap.set(identity, participant);
            });
            return combinedMap;
        });
    });

    useEffect(() => {
        if (!room) {
            return;
        }

        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);

            timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            timeoutsRef.current.clear();
        };
    }, [room, handleActiveSpeakersChanged]);

    return activeSpeakers;
}

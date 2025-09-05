import { useCallback, useEffect, useRef, useState } from 'react';

import { useRoomContext, useSpeakingParticipants } from '@livekit/components-react';
import type { Participant } from '@proton-meet/livekit-client';

export function useDebouncedActiveSpeakers(delayMs = 1000) {
    const room = useRoomContext();
    const currentActiveSpeakers = useSpeakingParticipants();
    const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
    const activeSpeakersRef = useRef<Participant[]>(activeSpeakers);
    const removalTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        activeSpeakersRef.current = activeSpeakers;
    }, [activeSpeakers]);

    const updateActiveSpeakers = useCallback(() => {
        const prev = activeSpeakersRef.current;

        prev.forEach((p) => {
            if (
                !currentActiveSpeakers.some((cp) => cp.identity === p.identity) &&
                !removalTimeouts.current.has(p.identity)
            ) {
                const timeout = setTimeout(() => {
                    setActiveSpeakers((latest) => latest.filter((ap) => ap.identity !== p.identity));
                    removalTimeouts.current.delete(p.identity);
                }, delayMs);
                removalTimeouts.current.set(p.identity, timeout);
            }
        });

        currentActiveSpeakers.forEach((p) => {
            const timeout = removalTimeouts.current.get(p.identity);
            if (timeout) {
                clearTimeout(timeout);
                removalTimeouts.current.delete(p.identity);
            }
        });

        const prevInGrace = prev.filter((p) => !currentActiveSpeakers.some((cp) => cp.identity === p.identity));
        const union = [...currentActiveSpeakers, ...prevInGrace];
        const seen = new Set<string>();
        const next = union.filter((p) => {
            if (seen.has(p.identity)) {
                return false;
            }
            seen.add(p.identity);
            return true;
        });

        setActiveSpeakers(next);
        activeSpeakersRef.current = next;
    }, [currentActiveSpeakers, delayMs]);

    useEffect(() => {
        if (!room) {
            return;
        }

        updateActiveSpeakers();

        return () => {
            removalTimeouts.current.forEach((timeout) => clearTimeout(timeout));
            removalTimeouts.current.clear();
        };
    }, [room, updateActiveSpeakers]);

    return activeSpeakers;
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { useApi } from '@proton/components';

import type { ParticipantEntity } from '../types';

export const queryParticipants = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${meetingLinkName}/participants`,
        silence: true,
    };
};

const FETCH_TIME_CONSTRAINT_MS = 5000;
const PARTICIPANT_COUNT_THRESHOLD = 10;

export const useParticipantNameMap = () => {
    const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const countRef = useRef(0);

    const isFetchingRef = useRef(false);

    const lastFetchTimestamp = useRef(0);

    const api = useApi();

    const handleFetch = useCallback(
        async (meetingLinkName: string) => {
            const response = await api<{ Participants: ParticipantEntity[] }>(queryParticipants(meetingLinkName));

            const participants = response.Participants;

            const updatedParticipantNameMap = Object.fromEntries(
                participants.map((participant) => [participant.ParticipantUUID, participant.DisplayName])
            );

            setParticipantNameMap(updatedParticipantNameMap);

            countRef.current = participants.length;

            isFetchingRef.current = false;

            lastFetchTimestamp.current = Date.now();
        },
        [api]
    );

    const getParticipants = useCallback(
        async (meetingLinkName: string) => {
            if (isFetchingRef.current) {
                return;
            }

            isFetchingRef.current = true;

            if (countRef.current > PARTICIPANT_COUNT_THRESHOLD) {
                const timeDiff = Date.now() - lastFetchTimestamp.current;

                const timeout = Math.max(FETCH_TIME_CONSTRAINT_MS - timeDiff, 0);

                timeoutRef.current = setTimeout(() => handleFetch(meetingLinkName), timeout);
            } else {
                await handleFetch(meetingLinkName);
            }
        },
        [handleFetch]
    );

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { participantNameMap, getParticipants };
};

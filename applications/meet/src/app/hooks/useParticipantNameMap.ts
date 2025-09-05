import { useEffect, useRef, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { queryParticipants } from '@proton/shared/lib/api/meet';

import type { ParticipantEntity } from '../types';

const FETCH_TIME_CONSTRAINT_MS = 5000;
const PARTICIPANT_COUNT_THRESHOLD = 10;

export const useParticipantNameMap = () => {
    const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
    const [participantsMap, setParticipantsMap] = useState<Record<string, ParticipantEntity>>({});

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const countRef = useRef(0);

    const isFetchingRef = useRef(false);

    const lastFetchTimestamp = useRef(0);

    const api = useApi();

    const handleFetch = async (meetingLinkName: string) => {
        const response = await api<{ Participants: ParticipantEntity[] }>(queryParticipants(meetingLinkName));

        const participants = response.Participants;

        const updatedParticipantNameMap = Object.fromEntries(
            participants.map((participant) => [participant.ParticipantUUID, participant.DisplayName])
        );

        setParticipantNameMap(updatedParticipantNameMap);

        const updatedParticipantsMap = Object.fromEntries(
            participants.map((participant) => [participant.ParticipantUUID, participant])
        );

        setParticipantsMap(updatedParticipantsMap);

        countRef.current = participants.length;

        isFetchingRef.current = false;

        lastFetchTimestamp.current = Date.now();
    };

    const getParticipants = async (meetingLinkName: string) => {
        try {
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
        } catch (error) {
            console.error(error);
        } finally {
            isFetchingRef.current = false;
        }
    };

    const resetParticipantNameMap = () => {
        setParticipantNameMap({});
        setParticipantsMap({});
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { participantNameMap, getParticipants, participantsMap, resetParticipantNameMap };
};

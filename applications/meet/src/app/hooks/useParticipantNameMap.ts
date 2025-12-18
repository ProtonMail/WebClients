import { useEffect, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import useApi from '@proton/components/hooks/useApi';
import { queryParticipants, queryParticipantsCount } from '@proton/shared/lib/api/meet';

import { ParticipantCapabilityPermission, type ParticipantEntity } from '../types';

const FETCH_TIME_CONSTRAINT_MS = 5000;
const PARTICIPANT_COUNT_THRESHOLD = 10;

export const useParticipantNameMap = () => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
    const [participantsMap, setParticipantsMap] = useState<Record<string, ParticipantEntity>>({});
    const [participantsCount, setParticipantsCount] = useState<number | null>(null);

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

        setParticipantNameMap((prev) => ({ ...prev, ...updatedParticipantNameMap }));

        const updatedParticipantsMap = Object.fromEntries(
            participants.map((participant) => [participant.ParticipantUUID, participant])
        );

        setParticipantsMap((prev) => ({ ...prev, ...updatedParticipantsMap }));

        countRef.current = participants.length;
        setParticipantsCount(participants.length);

        isFetchingRef.current = false;

        lastFetchTimestamp.current = Date.now();
    };

    const getParticipants = async (meetingLinkName: string) => {
        try {
            if (isFetchingRef.current) {
                return;
            }

            isFetchingRef.current = true;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            if (countRef.current > PARTICIPANT_COUNT_THRESHOLD) {
                const timeDiff = Date.now() - lastFetchTimestamp.current;

                const timeout = Math.max(FETCH_TIME_CONSTRAINT_MS - timeDiff, 0);

                timeoutRef.current = setTimeout(async () => {
                    try {
                        await handleFetch(meetingLinkName);
                    } catch (error) {
                        isFetchingRef.current = false;
                    }
                }, timeout);
            } else {
                await handleFetch(meetingLinkName);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            isFetchingRef.current = false;
        }
    };

    const getQueryParticipantsCount = async (meetingLinkName: string) => {
        try {
            const response = await api<{ Current: number }>(queryParticipantsCount(meetingLinkName));
            setParticipantsCount(response.Current);
            return response.Current;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    };

    const resetParticipantNameMap = () => {
        setParticipantNameMap({});
        setParticipantsMap({});
        setParticipantsCount(null);
    };

    const updateAdminParticipant = async (roomId: string, participantUid: string, participantType: Number) => {
        if (participantUid === localParticipant?.identity) {
            await getParticipants(roomId);
            return;
        }

        setParticipantsMap((prev) =>
            Object.fromEntries(
                Object.entries(prev).map(([key, value]) => {
                    const isTargetParticipant = value.ParticipantUUID === participantUid;
                    const isAdmin = isTargetParticipant && participantType === 1;
                    const adminPermission = isAdmin ? ParticipantCapabilityPermission.Allowed : value.IsAdmin;

                    return [
                        key,
                        {
                            ...value,
                            IsAdmin: adminPermission,
                        },
                    ];
                })
            )
        );
    };

    useEffect(() => {
        const handleParticipantDisconnected = (participant: Participant) => {
            setParticipantsMap((prev) => {
                const { [participant.identity]: removed, ...rest } = prev;
                return rest;
            });
            setParticipantsCount(Object(participantsMap).length);
        };

        room.on('participantDisconnected', handleParticipantDisconnected);

        return () => {
            room.off('participantDisconnected', handleParticipantDisconnected);
        };
    }, [room]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        participantNameMap,
        getParticipants,
        participantsMap,
        resetParticipantNameMap,
        updateAdminParticipant,
        getQueryParticipantsCount,
        participantsCount,
    };
};

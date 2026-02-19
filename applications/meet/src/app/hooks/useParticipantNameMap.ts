import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import useApi from '@proton/components/hooks/useApi';
import { queryParticipants, queryParticipantsCount } from '@proton/shared/lib/api/meet';
import isTruthy from '@proton/utils/isTruthy';

import { ParticipantCapabilityPermission, type ParticipantEntity } from '../types';

const FETCH_TIME_CONSTRAINT_MS = 5000;
const PARTICIPANT_COUNT_THRESHOLD = 10;
const REFRESH_CHECK_INTERVAL_MS = 30000;

export const useParticipantNameMap = (meetingLinkName: string) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    const [participantNameMap, setParticipantNameMap] = useState<Record<string, string>>({});
    const [participantsMap, setParticipantsMap] = useState<Record<string, ParticipantEntity>>({});

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

            setParticipantNameMap((prev) => ({ ...prev, ...updatedParticipantNameMap }));

            const updatedParticipantsMap = Object.fromEntries(
                participants.map((participant) => [participant.ParticipantUUID, participant])
            );

            setParticipantsMap((prev) => ({ ...prev, ...updatedParticipantsMap }));

            countRef.current = participants.length;
            isFetchingRef.current = false;

            lastFetchTimestamp.current = Date.now();
        },
        [api]
    );

    const getParticipants = useCallback(
        async (meetingLinkName: string) => {
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
        },
        [handleFetch]
    );

    const getQueryParticipantsCount = async (meetingLinkName: string) => {
        try {
            const response = await api<{ Current: number }>(queryParticipantsCount(meetingLinkName));
            return response.Current;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    };

    const resetParticipantNameMap = () => {
        setParticipantNameMap({});
        setParticipantsMap({});
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

    useEffect(() => {
        const handleParticipantConnected = () => getParticipants(meetingLinkName);
        room.on('participantConnected', handleParticipantConnected);

        return () => {
            room.off('participantConnected', handleParticipantConnected);
        };
    }, [room, getParticipants, meetingLinkName]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!meetingLinkName) {
                return;
            }

            const remoteParticipantIdentities = [...room.remoteParticipants.values()]
                .map((participant) => participant.identity)
                .filter(isTruthy) as string[];

            const hasMissingEntry = remoteParticipantIdentities.some((identity) => {
                return !(identity in participantNameMap) || !(identity in participantsMap);
            });

            if (hasMissingEntry) {
                void getParticipants(meetingLinkName);
            }
        }, REFRESH_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [room, meetingLinkName, participantNameMap, participantsMap, getParticipants]);

    return {
        participantNameMap,
        getParticipants,
        participantsMap,
        resetParticipantNameMap,
        updateAdminParticipant,
        getQueryParticipantsCount,
    };
};

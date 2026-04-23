import { type RefObject, useCallback, useEffect, useRef } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    mergeParticipantDecryptedNameMap,
    mergeParticipantsMap,
    removeParticipantFromMap,
    resetParticipantMaps,
    selectParticipantDecryptedNameMap,
    selectParticipantsMap,
    setIsFetchingParticipants,
    setParticipantAdmin,
} from '@proton/meet/store/slices/meetingInfo';
import type { ParticipantEntity } from '@proton/meet/types/types';
import { decryptDisplayNameWithKey } from '@proton/meet/utils/cryptoUtils';
import { queryParticipants, queryParticipantsCount } from '@proton/shared/lib/api/meet';
import isTruthy from '@proton/utils/isTruthy';

const FETCH_TIME_CONSTRAINT_MS = 5000;
const PARTICIPANT_COUNT_THRESHOLD = 10;
const REFRESH_CHECK_INTERVAL_MS = 30000;

export const useParticipantNameMap = (meetingLinkName: string, decryptionKeyRef?: RefObject<CryptoKey | null>) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    const dispatch = useMeetDispatch();

    const participantsMap = useMeetSelector(selectParticipantsMap);
    const participantsMapRef = useRef(participantsMap);
    participantsMapRef.current = participantsMap;

    const participantDecryptedNameMap = useMeetSelector(selectParticipantDecryptedNameMap);
    const participantDecryptedNameMapRef = useRef(participantDecryptedNameMap);
    participantDecryptedNameMapRef.current = participantDecryptedNameMap;

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const countRef = useRef(0);

    const isFetchingRef = useRef(false);

    const lastFetchTimestamp = useRef(0);

    const api = useApi();

    const handleFetch = useCallback(
        async (meetingLinkName: string) => {
            dispatch(setIsFetchingParticipants(true));
            const response = await api<{ Participants: ParticipantEntity[] }>(queryParticipants(meetingLinkName));

            const participants = response.Participants;
            const currentDecryptionKey = decryptionKeyRef?.current;

            const resolvedNames = await Promise.all(
                participants.map(async (participant) => {
                    // Skip if already resolved, unless we can now decrypt an encrypted name
                    // (e.g. session key wasn't available on a previous fetch)
                    const cached = participantDecryptedNameMapRef.current[participant.ParticipantUUID];
                    const displayName = participant.DisplayName ?? c('Display name').t`Loading…`;
                    // Only re-decrypt if the cached value is still the unencrypted fallback
                    if (cached && cached !== displayName) {
                        return cached;
                    }
                    if (currentDecryptionKey && participant.EncryptedDisplayName) {
                        try {
                            return await decryptDisplayNameWithKey(
                                currentDecryptionKey,
                                participant.EncryptedDisplayName
                            );
                        } catch {
                            return displayName;
                        }
                    }
                    return displayName;
                })
            );

            dispatch(setIsFetchingParticipants(false));

            dispatch(
                mergeParticipantsMap(
                    Object.fromEntries(participants.map((participant) => [participant.ParticipantUUID, participant]))
                )
            );
            dispatch(
                mergeParticipantDecryptedNameMap(
                    Object.fromEntries(
                        participants.map((participant, i) => [participant.ParticipantUUID, resolvedNames[i]])
                    )
                )
            );

            countRef.current = participants.length;
            isFetchingRef.current = false;

            lastFetchTimestamp.current = Date.now();
        },
        [api, dispatch, decryptionKeyRef]
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
        dispatch(resetParticipantMaps());
    };

    const updateAdminParticipant = async (roomId: string, participantUid: string, participantType: Number) => {
        if (participantUid === localParticipant?.identity) {
            await getParticipants(roomId);
            return;
        }

        dispatch(setParticipantAdmin({ participantUid, participantType: participantType as number }));
    };

    useEffect(() => {
        const handleParticipantDisconnected = (participant: Participant) => {
            dispatch(removeParticipantFromMap(participant.identity));
        };

        room.on('participantDisconnected', handleParticipantDisconnected);

        return () => {
            room.off('participantDisconnected', handleParticipantDisconnected);
        };
    }, [room, dispatch]);

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
                return (
                    !(identity in participantDecryptedNameMapRef.current) || !(identity in participantsMapRef.current)
                );
            });

            if (hasMissingEntry) {
                void getParticipants(meetingLinkName);
            }
        }, REFRESH_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [room, meetingLinkName, getParticipants]);

    return {
        participantDecryptedNameMap,
        getParticipants,
        participantsMap,
        resetParticipantNameMap,
        updateAdminParticipant,
        getQueryParticipantsCount,
    };
};

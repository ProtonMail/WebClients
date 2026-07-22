import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { useRoomContext } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useCreateInstantMeeting } from '@proton/meet/hooks/useCreateInstantMeeting';
import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setJoinedRoom, setJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';
import { setMeetingLocked } from '@proton/meet/store/slices/settings';
import { setMeetingReadyPopupOpen } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { decryptSessionKey, deriveEncryptionKeyFromSessionKey } from '@proton/meet/utils/cryptoUtils';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isWebRtcSupported } from '@proton/shared/lib/helpers/isWebRtcSupported';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { MeetingInfoResponse } from '@proton/shared/lib/interfaces/Meet';
import { useFlag } from '@proton/unleash/useFlag';

import { MEETING_LOCKED_ERROR_CODE } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { getIceCandidateInfo } from '../../utils/checkIfUsingTurnRelay';
import type { SRPHandshakeInfo } from '../srp/useMeetSrp';
import type { useMeetingSetup } from '../srp/useMeetingSetup';
import { logJoinStats } from '../telemetry/meetingTelemetry';
import { getUrlWithoutProtocol } from '../telemetry/utils';
import { isConnectionTimeoutError } from '../useLiveKitConnection';
import type { ConnectWithMlsResult, UseMeetingConnectionResult } from './useMeetingConnection';

type MeetingSetup = ReturnType<typeof useMeetingSetup>;

export interface MeetingDetails {
    meetingId: string;
    meetingPassword: string;
    meetingName: string;
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    expirationTime: number | null;
}

interface UseJoinFlowParams {
    token: string;
    urlPassword: string;
    isInstantJoin: boolean;
    setDisplayName: (name: string) => void;
    connectWithMls: UseMeetingConnectionResult['connectWithMls'];
    websocketUrlRef: MutableRefObject<string | null>;
    decryptionKeyRef: MutableRefObject<CryptoKey | null>;
    accessTokenRef: MutableRefObject<string | null>;
    meetingInfoRef: MutableRefObject<MeetingInfoResponse | null>;
    meetingLinkRef: MutableRefObject<string | null>;
    meetingLinkNameRef: MutableRefObject<string>;
    isGuestAdminRef: MutableRefObject<boolean>;
    isExpiringRef: MutableRefObject<boolean>;
    joinedRoomLoggedRef: MutableRefObject<boolean>;
    setMeetingDetails: Dispatch<SetStateAction<MeetingDetails>>;
    setIsWebRtcUnsupportedModalOpen: Dispatch<SetStateAction<boolean>>;
    setIsMeetingLockedModalOpen: Dispatch<SetStateAction<boolean>>;
    setIsConnectionFailedModalOpen: Dispatch<SetStateAction<boolean>>;
    getMeetingDetails: MeetingSetup['getMeetingDetails'];
    initHandshake: MeetingSetup['initHandshake'];
    getMeetingInfo: MeetingSetup['getMeetingInfo'];
    isUsingTurnRelay: boolean;
    handleHandshakeInfoFetch: (token: string) => Promise<{ handshakeInfo?: unknown; readyToDecrypt?: boolean }>;
    reportMeetError: ReportMeetError;
    withMeetingLinkNameTag: (options?: unknown) => unknown;
}

export interface UseJoinFlowResult {
    joinMeeting: (displayName: string, meetingToken?: string) => Promise<void>;
    joinInstantMeeting: (displayName: string) => Promise<void>;
}

const getNetworkHints = () => {
    const connection = (navigator as any).connection;
    if (!connection) {
        return {};
    }
    return {
        networkEffectiveType: connection.effectiveType as string | undefined,
        networkRtt: connection.rtt as number | undefined,
        networkDownlink: connection.downlink as number | undefined,
    };
};

const gatherAndLogJoinStats = async ({
    connectResult,
    room,
    roomId,
    isInstantJoin,
    websocketUrl,
    totalJoinMs,
    isUsingTurnRelay,
    reportMeetError,
}: {
    connectResult?: ConnectWithMlsResult;
    room: Room;
    roomId: string;
    isInstantJoin: boolean;
    websocketUrl: string | undefined;
    totalJoinMs: number | null;
    isUsingTurnRelay: boolean;
    reportMeetError: ReportMeetError;
}) => {
    const joinStats = {
        roomId,
        isReconnect: false,
        isInstantJoin,
        tokenFetchMs: connectResult?.tokenFetchMs ?? null,
        mlsSetupMs: connectResult?.mlsSetupMs ?? null,
        livekitConnectMs: connectResult?.livekitConnectMs ?? null,
        deviceInitMs: connectResult?.deviceInitMs ?? null,
        websocketUrl,
        totalJoinMs,
        stunFailed: connectResult?.connectionInfo.stunFailed ?? false,
        turnFallback: isUsingTurnRelay,
        connectionAttempts: connectResult?.connectionInfo.connectionAttempts ?? 0,
    };

    try {
        const [participantCount, iceCandidateInfo] = await Promise.all([
            connectResult?.participantCountPromise ?? Promise.resolve(undefined),
            totalJoinMs !== null ? getIceCandidateInfo(room) : Promise.resolve({}),
        ]);

        logJoinStats({
            ...joinStats,
            participantCount: participantCount ?? 0,
            ...iceCandidateInfo,
            ...getNetworkHints(),
        });
    } catch (error) {
        reportMeetError('Failed to gather and log join stats', {
            context: {
                error: error instanceof Error ? error.message : String(error),
                name: error instanceof Error ? error.name : 'UnknownError',
                joinStats,
            },
        });
    }
};

export const useJoinFlow = ({
    token,
    urlPassword,
    isInstantJoin,
    setDisplayName,
    connectWithMls,
    websocketUrlRef,
    decryptionKeyRef,
    accessTokenRef,
    meetingInfoRef,
    meetingLinkRef,
    meetingLinkNameRef,
    isGuestAdminRef,
    isExpiringRef,
    joinedRoomLoggedRef,
    setMeetingDetails,
    setIsWebRtcUnsupportedModalOpen,
    setIsMeetingLockedModalOpen,
    setIsConnectionFailedModalOpen,
    getMeetingDetails,
    initHandshake,
    getMeetingInfo,
    isUsingTurnRelay,
    handleHandshakeInfoFetch,
    reportMeetError,
    withMeetingLinkNameTag,
}: UseJoinFlowParams): UseJoinFlowResult => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();
    const history = useHistory();
    const meetCoreClient = useMeetCoreClient();
    const { createNotification } = useNotifications();
    const createInstantMeeting = useCreateInstantMeeting();
    const isGuest = useMeetSelector(selectIsGuest);
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);

    const isMeetClientMetricsLogEnabled = useFlag('MeetClientMetricsLog');
    const meetJoinTelemetryEnabled = useFlag('MeetJoinTelemetry');

    const joinBlockedRef = useRef(false);
    const loadingStartTimeRef = useRef(0);

    const getCachedMeetingInfo = useCallback(
        async (meetingToken: string) => {
            if (meetingInfoRef.current) {
                return meetingInfoRef.current;
            }
            const info = await getMeetingInfo(meetingToken);
            meetingInfoRef.current = info;
            return info;
        },
        [getMeetingInfo, meetingInfoRef]
    );

    const updateAccessToken = (accessToken: string) => {
        accessTokenRef.current = accessToken;
    };

    const handleMeetingIsLockedError = async () => {
        setIsMeetingLockedModalOpen(true);
    };

    const handleWebRtcUnsupported = () => {
        if (!isWebRtcSupported()) {
            setIsWebRtcUnsupportedModalOpen(true);
            throw new Error('Your browser does not support WebRTC');
        }
    };

    const handleJoin = async (displayName: string, meetingToken: string = token, meetingPassword: string) => {
        setDisplayName(displayName);

        let connectResult: ConnectWithMlsResult | undefined;

        try {
            const meetingInfo = await getCachedMeetingInfo(meetingToken);
            const sessionKey = await decryptSessionKey({
                encryptedSessionKey: meetingInfo.MeetingInfo.SessionKey,
                password: meetingPassword,
                salt: meetingInfo.MeetingInfo.Salt,
            });
            const decryptionKey = sessionKey ? await deriveEncryptionKeyFromSessionKey(sessionKey) : null;
            decryptionKeyRef.current = decryptionKey;

            connectResult = await connectWithMls({
                meetingToken,
                meetingPassword,
                displayName,
                timeoutMs: 20_000,
                queryParticipantsCount: true,
            });

            if (!meetingInfo.MeetingInfo.ExpirationTime) {
                meetingInfoRef.current = null;
            }

            if (meetJoinTelemetryEnabled) {
                const totalJoinMs = Date.now() - loadingStartTimeRef.current;
                if (totalJoinMs > 15_000) {
                    void gatherAndLogJoinStats({
                        room,
                        roomId: meetingToken,
                        connectResult,
                        isInstantJoin,
                        websocketUrl: getUrlWithoutProtocol(connectResult.websocketUrl),
                        totalJoinMs,
                        isUsingTurnRelay,
                        reportMeetError,
                    });
                }
            }

            // In case of mobile devices we need to set these states early, as the camera preview being active while initializing the devices for LiveKit causes issues.
            if (isMobile()) {
                dispatch(setJoinedRoom(true));
                dispatch(setJoiningInProgress(false));
                await wait(50);
            }

            const originalOnTokenRefresh = room.engine.client.onTokenRefresh;

            room.engine.client.onTokenRefresh = (token) => {
                updateAccessToken(token);
                originalOnTokenRefresh?.(token);
            };

            if (!isMobile()) {
                dispatch(setJoinedRoom(true));
                dispatch(setJoiningInProgress(false));
            }

            // Log successful room join (only once)
            if (!joinedRoomLoggedRef.current && meetCoreClient && isMeetClientMetricsLogEnabled) {
                joinedRoomLoggedRef.current = true;
                try {
                    await meetCoreClient.logJoinedRoom();
                } catch (error) {
                    reportMeetError('Failed to log joined room', withMeetingLinkNameTag(error));
                }
            }
        } catch (error: any) {
            if (meetJoinTelemetryEnabled) {
                void gatherAndLogJoinStats({
                    room,
                    roomId: meetingToken,
                    connectResult,
                    isInstantJoin,
                    websocketUrl: websocketUrlRef.current ? getUrlWithoutProtocol(websocketUrlRef.current) : undefined,
                    totalJoinMs: null,
                    isUsingTurnRelay,
                    reportMeetError,
                });
            }

            reportMeetError('Failed to join meeting', withMeetingLinkNameTag(error));

            dispatch(setJoiningInProgress(false));
            joinBlockedRef.current = false;

            const { code } = getApiError(error);

            // Log failed room join
            if (isMeetClientMetricsLogEnabled) {
                try {
                    await meetCoreClient.logJoinedRoomFailed(code ? String(code) : undefined);
                } catch (logError) {
                    reportMeetError('Failed to log joined room failed', withMeetingLinkNameTag(logError));
                }
            }

            if (code === MEETING_LOCKED_ERROR_CODE) {
                await handleMeetingIsLockedError();
                return;
            }
            if (isConnectionTimeoutError(error)) {
                setIsConnectionFailedModalOpen(true);
                return;
            }
            if (!error?.userNotified) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Failed to join meeting. Please try again.`,
                });
            }
        }
    };

    const joinInstantMeeting = async (displayName: string) => {
        handleWebRtcUnsupported();

        if (joinBlockedRef.current) {
            return;
        }
        dispatch(setJoiningInProgress(true));

        joinBlockedRef.current = true;

        loadingStartTimeRef.current = Date.now();

        try {
            await meetCoreClient.logStartToJoinRoom();
        } catch (error) {
            reportMeetError('Failed to log start to join room', withMeetingLinkNameTag(error));
        }

        try {
            const { id, passwordBase } = await createInstantMeeting({
                params: {},
                isGuest: isGuest,
                isPaidUser,
            });
            meetingLinkNameRef.current = id; // id is the meeting link name

            const handshakeResult = await handleHandshakeInfoFetch(id);

            if (!handshakeResult) {
                dispatch(setJoiningInProgress(false));
                joinBlockedRef.current = false;
                return;
            }

            const { roomName, locked, maxDuration, maxParticipants } = await getMeetingDetails({
                token: id,
                urlPassword: passwordBase,
                handshakeInfo: handshakeResult.handshakeInfo as SRPHandshakeInfo,
            });

            setMeetingDetails((prev) => ({
                ...prev,
                meetingId: id,
                meetingPassword: passwordBase,
                meetingName: roomName,
                locked,
                maxDuration,
                maxParticipants,
            }));

            dispatch(setMeetingLocked(locked));
            dispatch(setMeetingReadyPopupOpen(true));

            await handleJoin(displayName, id, passwordBase);

            meetingLinkRef.current = getMeetingLink(id, passwordBase);

            const meetingInfo = await getCachedMeetingInfo(id);

            setMeetingDetails((prev) => ({
                ...prev,
                expirationTime: 1000 * (meetingInfo.MeetingInfo.ExpirationTime ?? 0),
            }));

            isGuestAdminRef.current = isGuest;

            history.push(meetingLinkRef.current);
        } catch (error: any) {
            reportMeetError('Failed to create instant meeting', withMeetingLinkNameTag(error));
            dispatch(setJoiningInProgress(false));
            if (!error?.userNotified) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Failed to start meeting. Please try again.`,
                });
            }
        }

        joinBlockedRef.current = false;
    };

    const joinMeeting = async (displayName: string, meetingToken: string = token) => {
        isExpiringRef.current = false;
        meetingLinkNameRef.current = meetingToken; // meetingToken is the meeting link name
        handleWebRtcUnsupported();

        if (joinBlockedRef.current) {
            return;
        }

        dispatch(setJoiningInProgress(true));

        joinBlockedRef.current = true;

        loadingStartTimeRef.current = Date.now();

        try {
            await meetCoreClient.logStartToJoinRoom();
        } catch (error) {
            reportMeetError('Failed to log start to join room', withMeetingLinkNameTag(error));
        }

        try {
            const handshakeInfo = await initHandshake(meetingToken);

            if (!handshakeInfo) {
                dispatch(setJoiningInProgress(false));
                joinBlockedRef.current = false;
                return;
            }

            let details = {
                meetingName: '',
                locked: false,
                maxDuration: 0,
                maxParticipants: 0,
            };

            try {
                const { roomName, locked, maxDuration, maxParticipants } = await getMeetingDetails({
                    token: meetingToken,
                    urlPassword,
                    handshakeInfo: handshakeInfo as SRPHandshakeInfo,
                });

                details = {
                    meetingName: roomName,
                    locked,
                    maxDuration,
                    maxParticipants,
                };
            } catch (error: any) {
                dispatch(setJoiningInProgress(false));
                joinBlockedRef.current = false;
                if (!error?.userNotified) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Failed to join meeting. Please try again.`,
                    });
                }
                return;
            }

            setMeetingDetails((prev) => ({
                ...prev,
                meetingName: details.meetingName,
                locked: details.locked,
                maxDuration: details.maxDuration,
                maxParticipants: details.maxParticipants,
            }));

            dispatch(setMeetingLocked(details.locked));

            await handleJoin(displayName, meetingToken, urlPassword);

            meetingLinkRef.current = getMeetingLink(token, urlPassword);
            const meetingInfo = await getCachedMeetingInfo(meetingToken);

            setMeetingDetails((prev) => ({
                ...prev,
                expirationTime: 1000 * (meetingInfo.MeetingInfo.ExpirationTime ?? 0),
            }));
        } catch (error: any) {
            reportMeetError('Failed to join meeting', withMeetingLinkNameTag(error));
            dispatch(setJoiningInProgress(false));
            if (!error?.userNotified && !isConnectionTimeoutError(error)) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Failed to join meeting. Please try again.`,
                });
            }
        }

        joinBlockedRef.current = false;
    };

    return {
        joinMeeting,
        joinInstantMeeting,
    };
};

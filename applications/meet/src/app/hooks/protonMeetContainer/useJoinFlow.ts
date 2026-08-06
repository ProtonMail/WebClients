import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { useRoomContext } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { c } from 'ttag';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useCreateInstantMeeting } from '@proton/meet/hooks/useCreateInstantMeeting';
import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setJoinedRoom, setJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';
import { setMeetingInfo } from '@proton/meet/store/slices/meetingInfo';
import { setIsGuestAdmin } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectWaitingRoomSetting, setMeetingLocked, setWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import { setMeetingReadyPopupOpen } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { deriveEncryptionKeyFromSessionKey, encryptDisplayNameWithKey } from '@proton/meet/utils/cryptoUtils';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { sanitizeMessage } from '@proton/sanitize/purify';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { SECOND } from '@proton/shared/lib/constants';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isWebRtcSupported } from '@proton/shared/lib/helpers/isWebRtcSupported';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { MeetingInfoResponse } from '@proton/shared/lib/interfaces/Meet';
import { useFlag } from '@proton/unleash/useFlag';

import { MEETING_LOCKED_ERROR_CODE } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { getIceCandidateInfo } from '../../utils/checkIfUsingTurnRelay';
import { getPreloadedMeetingInfo } from '../../utils/meetingDetailsPreload';
import type { SRPHandshakeInfo } from '../srp/useMeetSrp';
import type { useMeetingSetup } from '../srp/useMeetingSetup';
import { logJoinStats } from '../telemetry/meetingTelemetry';
import { getUrlWithoutProtocol } from '../telemetry/utils';
import { isConnectionTimeoutError } from '../useLiveKitConnection';
import { useNotifyError } from '../useNotifyError';
import { useStableCallback } from '../useStableCallback';
import type { ConnectWithMlsResult, UseMeetingConnectionResult } from './useMeetingConnection';
import { useSessionKey } from './useSessionKey';
import { useWaitingRoom } from './waitingRoom/useWaitingRoom';

type MeetingSetup = ReturnType<typeof useMeetingSetup>;

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
    isExpiringRef: MutableRefObject<boolean>;
    joinedRoomLoggedRef: MutableRefObject<boolean>;
    setIsWebRtcUnsupportedModalOpen: Dispatch<SetStateAction<boolean>>;
    setIsMeetingLockedModalOpen: Dispatch<SetStateAction<boolean>>;
    setIsConnectionFailedModalOpen: Dispatch<SetStateAction<boolean>>;
    getMeetingDetails: MeetingSetup['getMeetingDetails'];
    getAccessDetails: MeetingSetup['getAccessDetails'];
    initHandshake: MeetingSetup['initHandshake'];
    getMeetingInfo: MeetingSetup['getMeetingInfo'];
    isUsingTurnRelay: boolean;
    handleHandshakeInfoFetch: (token: string) => Promise<{ handshakeInfo?: unknown; readyToDecrypt?: boolean }>;
    reportMeetError: ReportMeetError;
    withMeetingLinkNameTag: (options?: unknown) => unknown;
    displayName: string;
    cleanupMlsState: () => void;
    disallowHealthCheck: () => void;
}

export interface UseJoinFlowResult {
    joinMeeting: (displayName: string, meetingToken?: string) => Promise<void>;
    joinInstantMeeting: (displayName: string) => Promise<void>;
    waitingRoomProviderProps: ReturnType<typeof useWaitingRoom>['providerProps'];
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
    isExpiringRef,
    joinedRoomLoggedRef,
    setIsWebRtcUnsupportedModalOpen,
    setIsMeetingLockedModalOpen,
    setIsConnectionFailedModalOpen,
    getMeetingDetails,
    getAccessDetails,
    initHandshake,
    getMeetingInfo,
    isUsingTurnRelay,
    handleHandshakeInfoFetch,
    reportMeetError,
    withMeetingLinkNameTag,
    displayName,
    cleanupMlsState,
    disallowHealthCheck,
}: UseJoinFlowParams): UseJoinFlowResult => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();
    const history = useHistory();
    const meetCoreClient = useMeetCoreClient();
    const notifyJoinError = useNotifyError();
    const createInstantMeeting = useCreateInstantMeeting();
    const authentication = useAuthentication();
    const isGuest = useMeetSelector(selectIsGuest);
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);
    const waitingRoomSetting = useMeetSelector(selectWaitingRoomSetting);

    const isMeetClientMetricsLogEnabled = useFlag('MeetClientMetricsLog');
    const meetJoinTelemetryEnabled = useFlag('MeetJoinTelemetry');

    const joinBlockedRef = useRef(false);
    const loadingStartTimeRef = useRef(0);

    const getCachedMeetingInfo = useCallback(
        async (meetingLinkName: string, forceRefresh = false) => {
            if (meetingInfoRef.current && !forceRefresh) {
                return meetingInfoRef.current;
            }
            const preloaded = !forceRefresh
                ? await getPreloadedMeetingInfo(meetingLinkName)?.catch(() => undefined)
                : undefined;
            const info = preloaded ?? (await getMeetingInfo(meetingLinkName));
            meetingInfoRef.current = info;
            return info;
        },
        [getMeetingInfo, meetingInfoRef]
    );

    const { getSessionKey, getSessionKeyBase64 } = useSessionKey({ getCachedMeetingInfo, urlPassword });

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

    const handleJoin = async (
        displayName: string,
        meetingToken: string = token,
        meetingPassword: string,
        isWaitingRoom = false
    ) => {
        setDisplayName(displayName);

        let connectResult: ConnectWithMlsResult | undefined;

        try {
            const sessionKey = await getSessionKey(meetingToken, meetingPassword);
            const decryptionKey = sessionKey ? await deriveEncryptionKeyFromSessionKey(sessionKey) : null;
            decryptionKeyRef.current = decryptionKey;

            connectResult = await connectWithMls({
                meetingToken,
                meetingPassword,
                displayName,
                timeoutMs: 20 * SECOND,
                queryParticipantsCount: true,
                isWaitingRoom,
            });

            meetingLinkRef.current = getMeetingLink(meetingToken, meetingPassword);

            if (meetJoinTelemetryEnabled) {
                const totalJoinMs = Date.now() - loadingStartTimeRef.current;
                if (totalJoinMs > 15 * SECOND) {
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
                notifyJoinError(c('Error').t`Failed to join meeting. Please try again.`);
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
                waitingRoom: waitingRoomSetting,
            });
            meetingLinkNameRef.current = id; // id is the meeting link name

            const handshakeResult = await handleHandshakeInfoFetch(id);

            if (!handshakeResult) {
                dispatch(setJoiningInProgress(false));
                joinBlockedRef.current = false;
                return;
            }

            const { roomName, locked, maxDuration, maxParticipants, waitingRoom, canManageWaitingRoom } =
                await getMeetingDetails({
                    token: id,
                    urlPassword: passwordBase,
                    handshakeInfo: handshakeResult.handshakeInfo as SRPHandshakeInfo,
                });

            dispatch(
                setMeetingInfo({
                    meetingLinkName: id,
                    meetingPassword: passwordBase,
                    meetingName: roomName,
                    maxDuration,
                    maxParticipants,
                    canManageWaitingRoom,
                })
            );
            dispatch(setMeetingLocked(locked));
            dispatch(setWaitingRoomSetting(waitingRoom));
            dispatch(setMeetingReadyPopupOpen(true));

            await handleJoin(displayName, id, passwordBase, waitingRoom);

            // Force refresh the meeting info to get the latest expiration time
            const meetingInfo = await getCachedMeetingInfo(id, true);

            dispatch(
                setMeetingInfo({
                    expirationTime: SECOND * (meetingInfo.MeetingInfo.ExpirationTime ?? 0),
                })
            );
            dispatch(setIsGuestAdmin(isGuest));

            history.push(getMeetingLink(id, passwordBase));
        } catch (error: any) {
            reportMeetError('Failed to create instant meeting', withMeetingLinkNameTag(error));
            dispatch(setJoiningInProgress(false));
            if (!error?.userNotified) {
                notifyJoinError(c('Error').t`Failed to start meeting. Please try again.`);
            }
        }

        joinBlockedRef.current = false;
    };

    const cleanupWaitingRoomJoin = useCallback(() => {
        disallowHealthCheck();
        cleanupMlsState();
    }, [disallowHealthCheck, cleanupMlsState]);

    const getGuestWaitingRoomAccessToken = async (meetingToken: string) => {
        setDisplayName(displayName);
        const sanitizedParticipantName = sanitizeMessage(displayName);
        const sessionKey = await getSessionKey(meetingToken);
        if (!sessionKey) {
            throw new Error('Failed to decrypt session key for waiting room');
        }
        const decryptionKey = await deriveEncryptionKeyFromSessionKey(sessionKey);
        decryptionKeyRef.current = decryptionKey;
        const encryptedDisplayName = await encryptDisplayNameWithKey(decryptionKey, sanitizedParticipantName);
        const { accessToken } = await getAccessDetails({
            displayName: sanitizedParticipantName,
            token: meetingToken,
            encryptedDisplayName,
        });
        accessTokenRef.current = accessToken;
        return accessToken;
    };

    const getSessionId = () => (authentication.hasSession() ? authentication.getUID() : undefined);

    const prepareGuestSession = useStableCallback(async (meetingToken: string) => {
        try {
            const accessToken = await getGuestWaitingRoomAccessToken(meetingToken);
            await meetCoreClient.prepareMlsSessionForWaitingRoom(
                accessToken,
                meetingToken,
                urlPassword,
                getSessionId()
            );
            return true;
        } catch (error: any) {
            reportMeetError('Failed to prepare MLS session for waiting room', withMeetingLinkNameTag(error));
            if (!error?.userNotified) {
                notifyJoinError(c('Error').t`Failed to join meeting. Please try again.`);
            }
            return false;
        }
    });

    const refreshGuestSession = useStableCallback(async (meetingToken: string) => {
        try {
            const accessToken = await getGuestWaitingRoomAccessToken(meetingToken);
            await meetCoreClient.refreshWaitingRoomGuestSessionForJoinRequest(
                accessToken,
                meetingToken,
                urlPassword,
                getSessionId()
            );
            return true;
        } catch (error: any) {
            reportMeetError('Failed to refresh guest session for waiting room', withMeetingLinkNameTag(error));
            if (!error?.userNotified) {
                notifyJoinError(c('Error').t`Failed to join meeting. Please try again.`);
            }
            return false;
        }
    });

    const joinAfterAdmission = useStableCallback(async (meetingToken: string) => {
        dispatch(setJoiningInProgress(true));
        await handleJoin(displayName, meetingToken, urlPassword, true);
    });

    const { beginJoin: beginWaitingRoomJoin, providerProps: waitingRoomProviderProps } = useWaitingRoom({
        meetingLinkName: token,
        getSessionKeyBase64,
        prepareGuestSession,
        refreshGuestSession,
        joinAfterAdmission,
        cleanupJoin: cleanupWaitingRoomJoin,
    });

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
                waitingRoom: false,
                canManageWaitingRoom: false,
            };

            try {
                const { roomName, locked, maxDuration, maxParticipants, waitingRoom, canManageWaitingRoom } =
                    await getMeetingDetails({
                        token: meetingToken,
                        urlPassword,
                        handshakeInfo: handshakeInfo as SRPHandshakeInfo,
                    });

                details = {
                    meetingName: roomName,
                    locked,
                    maxDuration,
                    maxParticipants,
                    waitingRoom,
                    canManageWaitingRoom,
                };
            } catch (error: any) {
                dispatch(setJoiningInProgress(false));
                joinBlockedRef.current = false;
                if (!error?.userNotified) {
                    notifyJoinError(c('Error').t`Failed to join meeting. Please try again.`);
                }
                return;
            }

            dispatch(
                setMeetingInfo({
                    meetingName: details.meetingName,
                    maxDuration: details.maxDuration,
                    maxParticipants: details.maxParticipants,
                    canManageWaitingRoom: details.canManageWaitingRoom,
                })
            );

            dispatch(setMeetingLocked(details.locked));
            dispatch(setWaitingRoomSetting(details.waitingRoom));

            const waitingRoom = await beginWaitingRoomJoin(meetingToken, {
                canManageWaitingRoom: details.canManageWaitingRoom,
                waitingRoom: details.waitingRoom,
            });
            if (waitingRoom.handled) {
                // Guest is now in the waiting room; the real join happens after the host admits them.
                dispatch(setJoiningInProgress(false));
                joinBlockedRef.current = false;
                return;
            }

            await handleJoin(displayName, meetingToken, urlPassword, waitingRoom.isWaitingRoomHostJoin);

            // Force refresh the meeting info to get the latest expiration time
            const meetingInfo = await getCachedMeetingInfo(meetingToken, true);

            dispatch(setMeetingInfo({ expirationTime: SECOND * (meetingInfo.MeetingInfo.ExpirationTime ?? 0) }));
        } catch (error: any) {
            reportMeetError('Failed to join meeting', withMeetingLinkNameTag(error));
            dispatch(setJoiningInProgress(false));
            if (!error?.userNotified && !isConnectionTimeoutError(error)) {
                notifyJoinError(c('Error').t`Failed to join meeting. Please try again.`);
            }
        }

        joinBlockedRef.current = false;
    };

    return {
        joinMeeting,
        joinInstantMeeting,
        waitingRoomProviderProps,
    };
};

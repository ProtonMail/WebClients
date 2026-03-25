import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { type GroupKeyInfo, JoinTypeInfo, MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { ConnectionState, DisconnectReason, type Room, RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { useCreateInstantMeeting } from '@proton/meet/hooks/useCreateInstantMeeting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setPreviousMeetingLink, setUpsellModalType } from '@proton/meet/store/slices';
import { resetChatAndReactions } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { addKeyRotationLog, setMlsGroupState } from '@proton/meet/store/slices/meetingInfo';
import { toggleMeetingLockThunk } from '@proton/meet/store/slices/settings';
import {
    PopUpControls,
    resetUiState,
    setMeetingReadyPopupOpen,
    setPopupStateValue,
} from '@proton/meet/store/slices/uiStateSlice';
import { UpsellModalTypes } from '@proton/meet/types/types';
import type { KeyRotationLog, MLSGroupState } from '@proton/meet/types/types';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { sanitizeMessage } from '@proton/sanitize/purify';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { isWebRtcSupported } from '@proton/shared/lib/helpers/isWebRtcSupported';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getItem } from '@proton/shared/lib/helpers/storage';
import { CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { useFlag } from '@proton/unleash/useFlag';

import { ConnectionFailedModal } from '../../components/ConnectionFailedModal/ConnectionFailedModal';
import { ConnectionLostModal } from '../../components/ConnectionLostModal/ConnectionLostModal';
import { MeetingLockedModal } from '../../components/MeetingLockedModal/MeetingLockedModal';
import { MeetingOpenedInDesktopApp } from '../../components/MeetingOpenedInDesktopApp/MeetingOpenedInDesktopApp';
import { PasswordPrompt } from '../../components/PasswordPrompt/PasswordPrompt';
import { PiPPreviewVideo } from '../../components/PiPPreviewVideo/PiPPreviewVideo';
import { WebRtcUnsupportedModal } from '../../components/WebRtcUnsupportedModal/WebRtcUnsupportedModal';
import { MEETING_LOCKED_ERROR_CODE } from '../../constants';
import { useGuestContext } from '../../contexts/GuestProvider/GuestContext';
import { MLSContext } from '../../contexts/MLSContext';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useWasmApp } from '../../contexts/WasmContext';
import type { SRPHandshakeInfo } from '../../hooks/srp/useMeetSrp';
import { useMeetingSetup } from '../../hooks/srp/useMeetingSetup';
import { useAssignHost } from '../../hooks/useAssignHost';
import { useConnectionHealthCheck } from '../../hooks/useConnectionHealthCheck';
import { defaultDisplayNameHooks } from '../../hooks/useDefaultDisplayName';
import { useDependencySetup } from '../../hooks/useDependencySetup';
import { useIsTreatedAsPaidMeetUser } from '../../hooks/useIsTreatedAsPaidMeetUser';
import { MeetingListStatus } from '../../hooks/useMeetingList';
import { useIsRecordingInProgress } from '../../hooks/useMeetingRecorder/useIsRecordingInProgress';
import { useParticipantNameMap } from '../../hooks/useParticipantNameMap';
import { usePictureInPicture } from '../../hooks/usePictureInPicture/usePictureInPicture';
import { useSafariWebsocketVisibilityHandler } from '../../hooks/useSafariWebsocketVisibilityHandler';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useWakeLock } from '../../hooks/useWakeLock';
import { LoadingState } from '../../types';
import type { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { KeyRotationScheduler } from '../../utils/SeamlessKeyRotationScheduler';
import { checkIfUsingTurnRelay } from '../../utils/checkIfUsingTurnRelay';
import { getDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { isLocalParticipantAdmin } from '../../utils/isLocalParticipantAdmin';
import { getDisplayNameStorageKey } from '../../utils/storage';
import { cleanupWasmDependencies, setupLiveKitAdminChangeEvent, setupWasmDependencies } from '../../utils/wasmUtils';
import { MeetContainer } from '../MeetContainer';
import { PrejoinContainer } from '../PrejoinContainer/PrejoinContainer';

enum MeetingDecryptionReadinessStatus {
    UNINITIALIZED = 'uninitialized',
    INITIALIZED = 'initialized',
    READY_TO_DECRYPT = 'readyToDecrypt',
}

interface ProtonMeetContainerProps {
    room: Room;
    keyProvider: ProtonMeetKeyProvider;
    user?: UserModel | null;
    paidUser: boolean;
    isSubUser: boolean;
}

const isConnectionError = (error: any): boolean => {
    const msg = error?.message || '';
    return msg.includes('could not establish signal connection');
};

const isConnectionTimeoutError = (error: any): boolean => {
    const msg = error?.message || '';
    return msg.includes('Connection timeout after');
};

export const ProtonMeetContainer = ({
    room,
    keyProvider,
    user = null,
    paidUser = false,
    isSubUser = false,
}: ProtonMeetContainerProps) => {
    const dispatch = useMeetDispatch();
    const isGuest = useGuestContext();

    const promptOnTabClose = useFlag('MeetPromptOnTabClose');
    const showUpsellModalAfterMeeting = useFlag('MeetShowUpsellModalAfterMeeting');
    const meetUpsellEnabled = useFlag('MeetUpsell');
    const meetOpenLinksInDesktopApp = useFlag('MeetOpenLinksInDesktopApp');
    const newCTAModal = useFlag('MeetNewCTAModal');
    const usePreSharedKey = useFlag('MeetPreSharedKey');

    useWakeLock();

    const { personalMeeting, meetingsListStatus } = useDependencySetup();

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const instantJoinParam = searchParams.get('instantJoin');

    const [isInstantJoin, setIsInstantJoin] = useState(instantJoinParam === 'true');

    const [isUsingTurnRelay, setIsUsingTurnRelay] = useState(false);
    const [joiningLoaderHeader, setJoiningLoaderHeader] = useState<string | undefined>(undefined);
    const [joiningLoaderSubtitle, setJoiningLoaderSubtitle] = useState<string | undefined>(undefined);

    const { initializeDevices } = useMediaManagementContext();

    const authentication = useAuthentication();
    const { createNotification } = useNotifications();

    const { reportMeetError, clearSentryReportErrorCounts } = useMeetErrorReporting();
    const meetingLinkNameRef = useRef<string>('');
    const withMeetingLinkNameTag = useCallback((options?: unknown) => {
        const meetingLinkName = meetingLinkNameRef.current;
        if (!meetingLinkName) {
            return options;
        }

        const tags = { meetingLinkName };
        if (typeof options === 'string') {
            return { context: { error: options }, tags };
        } else if (options && typeof options === 'object') {
            const optionsWithTags = options as { tags?: Record<string, string> };
            return {
                ...optionsWithTags,
                tags: {
                    ...(optionsWithTags.tags ?? {}),
                    ...tags,
                },
            };
        }
        // option is not an expected type, return the tags
        return { tags };
    }, []);

    /**
     * Connect to LiveKit room with timeout handling.
     * Shows a warning notification when connection time exceeds timeout/2.
     * Throws an error if connection is not established within the specified timeout.
     */
    const connectWithTimeout = async (
        room: Room,
        url: string,
        token: string,
        timeout: number,
        options: Parameters<Room['connect']>[2],
        warningHeader?: string,
        warningSubtitle?: string
    ): Promise<void> => {
        const connectPromise = room.connect(url, token, options);

        let warningShown = false;
        const warningTime = Math.floor(timeout / 2);

        const warningTimer = setTimeout(() => {
            if (!warningShown) {
                warningShown = true;
                if (warningHeader) {
                    setJoiningLoaderHeader(warningHeader);
                }
                if (warningSubtitle) {
                    setJoiningLoaderSubtitle(warningSubtitle);
                }
                reportMeetError(
                    `Livekit room connection time abnormal (${warningTime}ms)`,
                    withMeetingLinkNameTag({
                        timeout: `${warningTime}ms`,
                        stage: 'warning',
                    })
                );
            }
        }, warningTime);

        let timeoutTimer: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutTimer = setTimeout(async () => {
                reportMeetError(
                    `Livekit room connection timeout (${timeout}ms)`,
                    withMeetingLinkNameTag({
                        timeout: `${timeout}ms`,
                        stage: 'failed',
                    })
                );
                reject(new Error(`Connection timeout after ${timeout}ms`));
            }, timeout);
        });

        try {
            await Promise.race([connectPromise, timeoutPromise]);
        } catch (error) {
            throw error;
        } finally {
            clearTimeout(warningTimer);
            if (timeoutTimer) {
                clearTimeout(timeoutTimer);
            }
        }
    };

    const connectViaTurnRelay = async (room: Room, url: string, token: string, timeout: number): Promise<void> => {
        try {
            await connectWithTimeout(room, url, token, timeout, {
                autoSubscribe: false,
                rtcConfig: { iceTransportPolicy: 'relay' },
                peerConnectionTimeout: timeout / 2,
            });
        } catch (error) {
            if (isConnectionTimeoutError(error)) {
                await room.disconnect();
            }
            throw error;
        }
    };

    const connectWithStunFallbackToTurnRelay = async (
        room: Room,
        url: string,
        token: string,
        timeout: number
    ): Promise<void> => {
        try {
            await connectWithTimeout(
                room,
                url,
                token,
                timeout,
                { autoSubscribe: false, peerConnectionTimeout: timeout / 2 },
                c('Warning').t`Connection is taking longer than expected`,
                c('Warning').t`Trying another route…`
            );
            setIsUsingTurnRelay(await checkIfUsingTurnRelay(room));
        } catch (roomConnectionError: any) {
            if (!isConnectionError(roomConnectionError) && !isConnectionTimeoutError(roomConnectionError)) {
                throw roomConnectionError;
            }

            const isTimeout = isConnectionTimeoutError(roomConnectionError);
            reportMeetError(
                `STUN UDP connection ${isTimeout ? 'timeout' : 'failed'}, trying with TURN relay`,
                withMeetingLinkNameTag(roomConnectionError)
            );
            setJoiningLoaderHeader(c('Warning').t`Connection is taking longer than expected`);
            setJoiningLoaderSubtitle(
                isTimeout
                    ? c('Warning').t`STUN UDP connection timeout, trying with TURN relay`
                    : c('Warning').t`STUN UDP connection failed, trying with TURN relay…`
            );

            if (isTimeout) {
                await room.disconnect();
            }

            await connectViaTurnRelay(room, url, token, timeout);
            setIsUsingTurnRelay(true);
        }
    };

    const history = useHistory();
    const createInstantMeeting = useCreateInstantMeeting();

    const [decryptionReadinessStatus, setDecryptionReadinessStatus] = useState(
        MeetingDecryptionReadinessStatus.UNINITIALIZED
    );

    const currentKeyRef = useRef<string | null>(null);

    const [password, setPassword] = useState('');
    const [invalidPassphrase, setInvalidPassphrase] = useState(false);
    const [isMeetingLockedModalOpen, setIsMeetingLockedModalOpen] = useState(false);
    const [isWebRtcUnsupportedModalOpen, setIsWebRtcUnsupportedModalOpen] = useState(false);
    const [openedInDesktopApp, setOpenedInDesktopApp] = useState(false);
    const [isConnectionFailedModalOpen, setIsConnectionFailedModalOpen] = useState(false);

    const { getMeetingDetails, initHandshake, token, urlPassword, getAccessDetails, getMeetingInfo } =
        useMeetingSetup();

    const instantMeetingRef = useRef(!token);

    const useDefaultDisplayName = isGuest
        ? defaultDisplayNameHooks.unauthenticated
        : defaultDisplayNameHooks.authenticated;
    const storedDisplayName = getItem(getDisplayNameStorageKey(isGuest, user?.ID));

    const defaultDisplayName = useDefaultDisplayName();

    const [displayName, setDisplayName] = useState(storedDisplayName || defaultDisplayName);

    const [joiningInProgress, setJoiningInProgress] = useState(false);
    const [joinedRoom, setJoinedRoom] = useState(false);

    const [meetingDetails, setMeetingDetails] = useState({
        meetingId: token,
        meetingPassword: urlPassword,
        meetingName: '',
        locked: false,
        maxDuration: 0,
        maxParticipants: 0,
        expirationTime: null as number | null,
    });

    const [connectionLost, setConnectionLost] = useState(false);
    const [prejoinParticipantCount, setPrejoinParticipantCount] = useState<number | null>(null);
    const [liveKitConnectionState, setLiveKitConnectionState] = useState<ConnectionState | null>(null);
    const [showReconnectedMessage, setShowReconnectedMessage] = useState(false);

    const liveKitConnectionStateRef = useRef<ConnectionState | null>(null);
    const accessTokenRef = useRef<string | null>(null);

    const {
        getParticipants,
        participantNameMap,
        participantsMap,
        resetParticipantNameMap,
        updateAdminParticipant,
        getQueryParticipantsCount,
    } = useParticipantNameMap(meetingDetails.meetingId as string);

    const {
        stopPiP,
        startPiP,
        isPipActive,
        canvas,
        tracksLength,
        preparePictureInPicture,
        pictureInPictureWarmup,
        pipCleanup,
    } = usePictureInPicture({
        isDisconnected: connectionLost,
        participantNameMap,
    });

    const isRecordingInProgress = useIsRecordingInProgress();

    const joinBlockedRef = useRef(false);
    const lastEpochRef = useRef<bigint | null>(null);
    const joinedRoomLoggedRef = useRef(false);

    const loadingStartTimeRef = useRef(0);
    const mlsGroupStateRef = useRef<MLSGroupState | null>(null);

    const wasmApp = useWasmApp();

    const mlsSetupDone = useRef(false);

    const meetingLinkRef = useRef<string | null>(null);

    const notifications = useNotifications();

    const [keyRotationScheduler] = useState(() => new KeyRotationScheduler(keyProvider));

    const isGuestAdminRef = useRef(false);

    const isMeetNewJoinTypeEnabled = useFlag('MeetNewJoinType');
    const isMeetSwitchJoinTypeEnabled = useFlag('MeetSwitchJoinType');
    const isMeetSeamlessKeyRotationEnabled = useFlag('MeetSeamlessKeyRotationEnabled');
    const isMeetClientMetricsLogEnabled = useFlag('MeetClientMetricsLog');

    const { allowHealthCheck, disallowHealthCheck } = useConnectionHealthCheck({
        wasmApp,
        mlsGroupStateRef,
        setConnectionLost,
    });

    useSafariWebsocketVisibilityHandler({
        wasmApp,
        joinedRoom,
    });

    const {
        isLocalParticipantHost,
        isLocalParticipantAdmin: isLocalParticipantAdminLevelUser,
        hasAnotherAdmin,
    } = isLocalParticipantAdmin(participantsMap, room.localParticipant);

    const shareLink = `${window.location.origin}${getMeetingLink(
        meetingDetails.meetingId,
        meetingDetails.meetingPassword
    )}`;

    // Check if joining own personal meeting room
    const isPersonalRoom = !isGuest && personalMeeting?.MeetingLinkName === token;

    // Check if still loading meetings (to avoid showing wrong title initially)
    const isLoadingMeetings =
        !isGuest &&
        (meetingsListStatus === MeetingListStatus.InitialLoading ||
            meetingsListStatus === MeetingListStatus.InitialDecrypting);

    // Override room name if joining own personal meeting room
    const displayRoomName = isPersonalRoom ? c('Title').t`Personal meeting room` : meetingDetails.meetingName;

    const hasEpochError = (epoch: bigint | undefined) => {
        if (epoch && lastEpochRef.current && lastEpochRef.current > epoch) {
            return 'Lower epoch than last epoch';
        }

        if (epoch && lastEpochRef.current && lastEpochRef.current + 1n !== epoch) {
            return 'Epoch is not the next epoch';
        }

        return null;
    };

    const reportMLSRelatedError = (key: string | undefined, epoch: bigint | undefined) => {
        if (epoch && lastEpochRef.current && lastEpochRef.current > epoch) {
            reportMeetError('Lower epoch than last epoch', withMeetingLinkNameTag({ epoch }));
        }

        if (epoch && lastEpochRef.current && lastEpochRef.current + 1n !== epoch) {
            reportMeetError('Epoch is not the next epoch', withMeetingLinkNameTag({ epoch }));
        }

        if (!key) {
            reportMeetError('Key is undefined', withMeetingLinkNameTag({ epoch }));
        }

        if (!epoch) {
            reportMeetError('Epoch is undefined', withMeetingLinkNameTag({}));
        }
    };
    const assignHost = useAssignHost(accessTokenRef.current as string, token);

    const getGroupKeyInfo = async () => {
        try {
            const newGroupKeyInfo = (await wasmApp?.getGroupKey()) as GroupKeyInfo;
            currentKeyRef.current = newGroupKeyInfo.key;
            const displayCode = await wasmApp?.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: Number(newGroupKeyInfo.epoch),
            };
            dispatch(setMlsGroupState(nextMlsGroupState));
            mlsGroupStateRef.current = nextMlsGroupState;
            return { key: newGroupKeyInfo.key, epoch: newGroupKeyInfo.epoch };
        } catch (err: any) {
            reportMeetError('Error while calling getGroupKeyInfo', withMeetingLinkNameTag(err));
            throw err;
        }
    };

    const onNewGroupKeyInfo = async (key: string, epoch: bigint) => {
        try {
            reportMLSRelatedError(key, epoch);
            if (isMeetSeamlessKeyRotationEnabled) {
                await keyRotationScheduler.schedule(key, epoch);
            } else {
                await keyProvider.setKeyWithEpoch(key, epoch);
            }

            const displayCode = await wasmApp?.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: Number(epoch),
            };
            dispatch(setMlsGroupState(nextMlsGroupState));
            mlsGroupStateRef.current = nextMlsGroupState;

            if (isMeetClientMetricsLogEnabled) {
                try {
                    await wasmApp?.tryLogDesignatedCommitter(Number(epoch));
                } catch (error) {
                    reportMeetError('Failed to log designated committer rank', withMeetingLinkNameTag(error));
                }
            }

            const errorMessage = hasEpochError(epoch);

            const newLog = {
                timestamp: Date.now(),
                epoch: Number(epoch),
                type: errorMessage ? 'error' : 'log',
                message: errorMessage ?? 'Key rotation successful',
            };

            dispatch(addKeyRotationLog(newLog as KeyRotationLog));

            lastEpochRef.current = epoch;
        } catch (err) {
            dispatch(
                addKeyRotationLog({
                    timestamp: Date.now(),
                    epoch: Number(epoch),
                    type: 'error',
                    message: 'Could not set new encryption key',
                })
            );
            reportMeetError('Could not set new encryption key', withMeetingLinkNameTag(err));
        }
    };

    const handleMlsSetup = async (
        meetingLinkName: string,
        accessToken: string,
        meetingPassword: string,
        participantsCountValue?: number | null
    ) => {
        if (!mlsSetupDone.current) {
            mlsSetupDone.current = true;

            setupWasmDependencies({ getGroupKeyInfo, onNewGroupKeyInfo });
            setupLiveKitAdminChangeEvent({ onLiveKitAdminChanged: updateAdminParticipant });
        }

        if (!wasmApp) {
            return;
        }
        try {
            const sessionId = authentication.hasSession() ? authentication.getUID() : null;
            const joinType = wasmApp.getJoinType(
                isMeetNewJoinTypeEnabled,
                isMeetSwitchJoinTypeEnabled,
                participantsCountValue ?? 0
            );
            if (joinType === JoinTypeInfo.ExternalProposal) {
                // eslint-disable-next-line no-console
                console.log('Joining room with proposal');
                try {
                    await wasmApp.joinRoomWithProposal(
                        accessToken,
                        meetingLinkName,
                        meetingPassword,
                        usePreSharedKey,
                        sessionId
                    );
                } catch (error) {
                    // fallback to join with external commit
                    await wasmApp.joinMeetingWithAccessToken(
                        accessToken,
                        meetingLinkName,
                        meetingPassword,
                        usePreSharedKey,
                        sessionId
                    );
                }
            } else {
                await wasmApp.joinMeetingWithAccessToken(
                    accessToken,
                    meetingLinkName,
                    meetingPassword,
                    usePreSharedKey,
                    sessionId
                );
            }

            await wasmApp.setMlsGroupUpdateHandler();
            await wasmApp.setLiveKitAdminChangeHandler();

            const groupKeyData = await wasmApp.getGroupKey();

            currentKeyRef.current = groupKeyData.key;

            const displayCode = await wasmApp?.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: Number(groupKeyData.epoch),
            };
            dispatch(setMlsGroupState(nextMlsGroupState));
            mlsGroupStateRef.current = nextMlsGroupState;

            allowHealthCheck();

            return groupKeyData;
        } catch (error) {
            switch (error) {
                // TODO: Show a custom error message to the user for each error
                case MeetCoreErrorEnum.MlsServerVersionNotSupported:
                    throw new Error(
                        c('Error')
                            .t`This meeting is on an older version, the host must end it and refresh Meet to restart with the latest version.`
                    );
                case MeetCoreErrorEnum.MaxRetriesReached:
                case MeetCoreErrorEnum.HttpClientError:
                default:
                    // eslint-disable-next-line no-console
                    console.error(error);
                    throw new Error(c('Error').t`Failed to join meeting. Please try again later.`);
            }
        }
    };

    const updateAccessToken = (accessToken: string) => {
        accessTokenRef.current = accessToken;
    };

    // Log connection lost when connectionLost state changes to true
    useEffect(() => {
        if (connectionLost && wasmApp && joinedRoom && isMeetClientMetricsLogEnabled) {
            void wasmApp
                .logConnectionLost()
                .catch((error) => reportMeetError('Failed to log connection lost', withMeetingLinkNameTag(error)));
        }
    }, [connectionLost, wasmApp, joinedRoom]);

    const submitPassword = async () => {
        try {
            setInvalidPassphrase(false);

            const handshakeInfo = await initHandshake(token);

            const { roomName, locked, maxDuration, maxParticipants } = await getMeetingDetails({
                customPassword: password,
                urlPassword,
                token,
                handshakeInfo: handshakeInfo as SRPHandshakeInfo,
            });

            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            setMeetingDetails((prev) => ({
                ...prev,
                meetingName: roomName,
                locked,
                maxDuration,
                maxParticipants,
            }));

            return true;
        } catch (error) {
            setInvalidPassphrase(true);
            return false;
        }
    };

    const handleHandshakeInfoFetch = async (token: string) => {
        try {
            const handshakeInfo = await initHandshake(token);

            if (handshakeInfo?.CustomPassword === CustomPasswordState.PASSWORD_SET) {
                setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.INITIALIZED);

                return {
                    handshakeInfo,
                    readyToDecrypt: false,
                };
            }

            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            return {
                handshakeInfo,
                readyToDecrypt: true,
            };
        } catch {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`The meeting link you are trying to access does not exist or may have been deleted.`,
                expiration: 20000,
            });

            if (!isGuest) {
                history.push('/dashboard');
            }

            return {};
        }
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

        try {
            const sanitizedParticipantName = sanitizeMessage(displayName);

            const { websocketUrl, accessToken } = await getAccessDetails({
                displayName: sanitizedParticipantName,
                token: meetingToken,
            });

            // get participants count from the API so we can know which joinType to use based on the participants count
            const participantsCountValue = (await getQueryParticipantsCount(meetingToken)) ?? 0;

            // Set count for prejoin loader
            setPrejoinParticipantCount(participantsCountValue);

            accessTokenRef.current = accessToken;

            const { key: groupKey, epoch } =
                (await handleMlsSetup(meetingToken, accessToken, meetingPassword, participantsCountValue)) || {};

            reportMLSRelatedError(groupKey, epoch);

            if (!groupKey || !epoch) {
                throw new Error('Group key or epoch is missing');
            }

            dispatch(
                addKeyRotationLog({
                    timestamp: Date.now(),
                    epoch: Number(epoch),
                    type: 'log',
                    message: 'Key rotation successful',
                })
            );

            if (isMeetSeamlessKeyRotationEnabled) {
                // eslint-disable-next-line no-console
                console.log('Enabled seamless key rotation');
                await keyRotationScheduler.schedule(groupKey, epoch);
            } else {
                await keyProvider.setKeyWithEpoch(groupKey, epoch);
            }
            const timeoutMs = 20_000;
            try {
                await room.setE2EEEnabled(true);
                // Start device init concurrently with connect so the camera track is included in the initial SDP offer
                // rather than a post-connect renegotiation.
                // On Safari with H264, renegotiation can cause the simulcast encoder to fail silently.
                // E2EE is already enabled above so the queued publish will be encrypted.
                const initDevices = initializeDevices(5_000);
                await connectWithStunFallbackToTurnRelay(room, websocketUrl, accessToken, timeoutMs);
                await initDevices;
            } catch (livekitError: any) {
                // If LiveKit connection fails after MLS join, clean up MLS group to prevent inconsistent state
                try {
                    await wasmApp?.leaveMeeting();
                } catch (leaveError) {
                    reportMeetError(
                        'Failed to leave MLS group after LiveKit connection failure',
                        withMeetingLinkNameTag(leaveError)
                    );
                }
                mlsSetupDone.current = false;
                disallowHealthCheck();
                if (isMeetSeamlessKeyRotationEnabled) {
                    keyRotationScheduler.clean();
                } else {
                    keyProvider.cleanCurrent();
                }
                throw livekitError;
            }

            await getParticipants(meetingToken);

            // In case of mobile devices we need to set these states early, as the camera preview being active while initializing the devices for LiveKit causes issues.
            if (isMobile()) {
                setJoinedRoom(true);
                setJoiningInProgress(false);
                await wait(50);
            }

            const originalOnTokenRefresh = room.engine.client.onTokenRefresh;

            room.engine.client.onTokenRefresh = (token) => {
                updateAccessToken(token);
                originalOnTokenRefresh?.(token);
            };

            // Tracks WebSocket/media connection status at the transport layer
            // If connectionLost is true, the MLS modal takes precedence and banner is hidden
            room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
                const previousState = liveKitConnectionStateRef.current;
                liveKitConnectionStateRef.current = state;
                setLiveKitConnectionState(state);

                if (
                    state === ConnectionState.Connected &&
                    previousState !== null &&
                    previousState !== ConnectionState.Connected
                ) {
                    // Show brief "Reconnected" message only if MLS health check hasn't failed
                    setShowReconnectedMessage(true);
                    setTimeout(() => {
                        setShowReconnectedMessage(false);
                        // Don't clear state immediately - let MLS health check run first
                        setTimeout(() => {
                            setLiveKitConnectionState(null);
                            liveKitConnectionStateRef.current = null;
                        }, 1000);
                    }, 3000);
                } else if (state === ConnectionState.Connected) {
                    setShowReconnectedMessage(false);
                }
            });

            room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
                instantMeetingRef.current = false;
                mlsSetupDone.current = false;
                disallowHealthCheck();

                setJoinedRoom(false);
                setLiveKitConnectionState(null);
                setShowReconnectedMessage(false);
                liveKitConnectionStateRef.current = null;

                joinedRoomLoggedRef.current = false;
                void wasmApp?.leaveMeeting();
                void stopPiP();

                // Cleanup WASM polling interval to prevent MLS errors after leaving
                cleanupWasmDependencies();

                dispatch(resetChatAndReactions());
                if (newCTAModal) {
                    dispatch(resetUiState());
                }

                if (reason === DisconnectReason.ROOM_DELETED) {
                    if (newCTAModal) {
                        dispatch(setPreviousMeetingLink(meetingLinkRef.current));
                        dispatch(setUpsellModalType(UpsellModalTypes.MeetingEnded));
                    } else {
                        createNotification({
                            type: 'info',
                            text: c('Info').t`The host has ended the meeting`,
                        });
                    }
                } else if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
                    if (newCTAModal) {
                        dispatch(setPreviousMeetingLink(meetingLinkRef.current));
                        dispatch(setUpsellModalType(UpsellModalTypes.RemovedFromMeeting));
                    } else {
                        createNotification({
                            type: 'warning',
                            text: c('Warning').t`The host has removed you from the meeting`,
                        });
                    }
                } else if (reason !== undefined && reason !== DisconnectReason.CLIENT_INITIATED) {
                    // Log abnormal error to sentry
                    reportMeetError('Room disconnected unexpectedly', withMeetingLinkNameTag(DisconnectReason[reason]));
                }
                meetingLinkNameRef.current = '';

                if (reason === DisconnectReason.ROOM_DELETED || reason === DisconnectReason.PARTICIPANT_REMOVED) {
                    history.push('/dashboard');
                }
            });

            if (!isMobile()) {
                setJoinedRoom(true);
                setJoiningInProgress(false);
            }

            // Log successful room join (only once)
            if (!joinedRoomLoggedRef.current && wasmApp && isMeetClientMetricsLogEnabled) {
                joinedRoomLoggedRef.current = true;
                try {
                    await wasmApp.logJoinedRoom();
                } catch (error) {
                    reportMeetError('Failed to log joined room', withMeetingLinkNameTag(error));
                }
            }
        } catch (error: any) {
            reportMeetError('Failed to join meeting', withMeetingLinkNameTag(error));

            setJoiningInProgress(false);
            joinBlockedRef.current = false;

            const { code } = getApiError(error);

            // Log failed room join
            if (isMeetClientMetricsLogEnabled) {
                try {
                    await wasmApp?.logJoinedRoomFailed(code ? String(code) : undefined);
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
            }
        }
    };

    const joinInstantMeeting = async (displayName: string) => {
        handleWebRtcUnsupported();

        if (joinBlockedRef.current) {
            return;
        }
        setJoiningInProgress(true);

        joinBlockedRef.current = true;

        loadingStartTimeRef.current = Date.now();

        try {
            const { id, passwordBase } = await createInstantMeeting({
                params: {},
                isGuest: isGuest,
                isPaidUser: paidUser,
            });
            meetingLinkNameRef.current = id; // id is the meeting link name

            const handshakeResult = await handleHandshakeInfoFetch(id);

            if (!handshakeResult) {
                setJoiningInProgress(false);
                joinBlockedRef.current = false;
                return;
            }

            const { roomName, locked, maxDuration, maxParticipants } = await getMeetingDetails({
                token: id,
                customPassword: '',
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

            dispatch(setMeetingReadyPopupOpen(true));

            await handleJoin(displayName, id, passwordBase);

            meetingLinkRef.current = getMeetingLink(id, passwordBase);

            const meetingInfo = await getMeetingInfo(id);

            setMeetingDetails((prev) => ({
                ...prev,
                expirationTime: 1000 * (meetingInfo.MeetingInfo.ExpirationTime ?? 0),
            }));

            isGuestAdminRef.current = isGuest;

            history.push(meetingLinkRef.current);
        } catch (error: any) {
            reportMeetError('Failed to create instant meeting', withMeetingLinkNameTag(error));
            setJoiningInProgress(false);
        }

        joinBlockedRef.current = false;
    };

    const joinMeeting = async (displayName: string, meetingToken: string = token) => {
        meetingLinkNameRef.current = meetingToken; // meetingToken is the meeting link name
        handleWebRtcUnsupported();

        if (joinBlockedRef.current) {
            return;
        }

        setJoiningInProgress(true);

        joinBlockedRef.current = true;

        loadingStartTimeRef.current = Date.now();

        try {
            const handshakeInfo = await initHandshake(meetingToken);

            if (!handshakeInfo) {
                setJoiningInProgress(false);
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
                    customPassword: password,
                    urlPassword,
                    handshakeInfo: handshakeInfo as SRPHandshakeInfo,
                });

                details = {
                    meetingName: roomName,
                    locked,
                    maxDuration,
                    maxParticipants,
                };
            } catch {
                createNotification({
                    type: 'error',
                    text: c('Error').t`The meeting password is incorrect`,
                });

                setJoiningInProgress(false);
                joinBlockedRef.current = false;

                return;
            }

            setMeetingDetails((prev) => ({
                ...prev,
                meetingName: details.meetingName,
                locked: details.locked,
                maxDuration: details.maxDuration,
                maxParticipants: details.maxParticipants,
            }));

            await handleJoin(displayName, meetingToken, urlPassword);

            meetingLinkRef.current = getMeetingLink(token, urlPassword);
            const meetingInfo = await getMeetingInfo(meetingToken);

            setMeetingDetails((prev) => ({
                ...prev,
                expirationTime: 1000 * (meetingInfo.MeetingInfo.ExpirationTime ?? 0),
            }));
        } catch (error: any) {
            reportMeetError('Failed to join meeting', withMeetingLinkNameTag(error));
            setJoiningInProgress(false);
        }

        joinBlockedRef.current = false;
    };

    const setup = async () => {
        if (meetOpenLinksInDesktopApp && getDesktopAppPreference() && token && !isInstantJoin && !isElectronApp) {
            setOpenedInDesktopApp(true);

            tryOpenInDesktopApp(shareLink);
            return;
        }

        if (instantMeetingRef.current) {
            setDecryptionReadinessStatus(MeetingDecryptionReadinessStatus.READY_TO_DECRYPT);

            return;
        }

        await handleHandshakeInfoFetch(token);
    };

    useEffect(() => {
        void setup();
    }, []);

    const prepareUpsell = () => {
        if (!showUpsellModalAfterMeeting || !meetUpsellEnabled) {
            if (isGuest) {
                history.push(meetingLinkRef.current as string);
            } else {
                history.push('/dashboard');
            }
            return;
        }

        dispatch(setPreviousMeetingLink(meetingLinkRef.current));

        if (isGuest) {
            dispatch(setUpsellModalType(UpsellModalTypes.GuestAccount));
        }

        if (isLocalParticipantHost && !paidUser) {
            dispatch(setUpsellModalType(UpsellModalTypes.HostFreeAccount));
        }

        if (isLocalParticipantHost && (paidUser || isSubUser)) {
            dispatch(setUpsellModalType(UpsellModalTypes.HostPaidAccount));
        }

        if (!isLocalParticipantHost && user && !paidUser) {
            dispatch(setUpsellModalType(UpsellModalTypes.FreeAccount));
        }

        if (!isLocalParticipantHost && user && (paidUser || isSubUser)) {
            dispatch(setUpsellModalType(UpsellModalTypes.PaidAccount));
        }

        history.push('/dashboard');
    };

    const handleLeave = () => {
        instantMeetingRef.current = false;
        meetingLinkNameRef.current = '';
        void room.disconnect();
        resetParticipantNameMap();
        void wasmApp?.leaveMeeting();
        void stopPiP();
        mlsSetupDone.current = false; // need to set mls again after leave meeting
        disallowHealthCheck();

        // Cleanup WASM polling interval to prevent MLS errors after leaving
        cleanupWasmDependencies();

        if (isMeetSeamlessKeyRotationEnabled) {
            // clean the current key and epoch to avoid use them in next meeting
            keyRotationScheduler.clean();
        }

        setJoinedRoom(false);

        // Clear loader states on leave
        setJoiningLoaderHeader(undefined);
        setJoiningLoaderSubtitle(undefined);

        keyProvider.cleanCurrent();
        clearSentryReportErrorCounts();
        prepareUpsell();
    };

    const handleUngracefulLeave = () => {
        instantMeetingRef.current = false;
        meetingLinkNameRef.current = '';

        // Best effort because it is ungraceful
        try {
            void room.disconnect();
            void wasmApp?.leaveMeeting();
            void stopPiP();
        } catch {
        } finally {
            resetParticipantNameMap();
        }

        mlsSetupDone.current = false; // need to set mls again after leave meeting
        disallowHealthCheck();

        // Cleanup WASM polling interval to prevent MLS errors after leaving
        cleanupWasmDependencies();

        if (isMeetSeamlessKeyRotationEnabled) {
            // clean the current key and epoch to avoid use them in next meeting
            keyRotationScheduler.clean();
        }
        setJoinedRoom(false);
        keyProvider.cleanCurrent();
    };

    const handleEndMeeting = async () => {
        if (!wasmApp) {
            return;
        }

        try {
            await wasmApp.endMeeting();
        } catch (err) {
            reportMeetError('Unable to end meeting for all', withMeetingLinkNameTag(err));
        }

        // Always perform cleanup regardless of endMeeting success/failure
        instantMeetingRef.current = false;
        meetingLinkNameRef.current = '';
        resetParticipantNameMap();
        mlsSetupDone.current = false; // need to set mls again after leave meeting

        // Cleanup WASM polling interval to prevent MLS errors after leaving
        cleanupWasmDependencies();

        setJoinedRoom(false);

        keyProvider.cleanCurrent();
    };

    const handleMeetingLockToggle = useStableCallback(async () => {
        await dispatch(
            toggleMeetingLockThunk({ meetingLinkName: token, accessToken: accessTokenRef.current as string })
        );
    });

    // Warn user before leaving if in a meeting
    useEffect(() => {
        if (!promptOnTabClose) {
            return;
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (joinedRoom) {
                e.preventDefault();
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [joinedRoom]);

    // Actually disconnect when page unloads (after user confirms)
    useEffect(() => {
        const handleUnload = () => {
            if (joinedRoom) {
                try {
                    void room.disconnect();
                    void wasmApp?.leaveMeeting();
                } catch (error) {
                    reportMeetError('Error leaving meeting', withMeetingLinkNameTag(error));
                }
            }
        };

        window.addEventListener('unload', handleUnload);
        return () => {
            window.removeEventListener('unload', handleUnload);
        };
    }, [joinedRoom, room, wasmApp, reportMeetError]);

    const handleInstantJoin = async () => {
        if (isInstantJoin) {
            await joinInstantMeeting(displayName);
        }

        setIsInstantJoin(false);
    };

    useEffect(() => {
        void handleInstantJoin();
    }, []);

    useEffect(() => {
        if (!joinedRoom) {
            return;
        }

        const unblock = history.block((location, action) => {
            if (action === 'POP') {
                const userIsAdminLevel = isLocalParticipantHost || isLocalParticipantAdminLevelUser;
                if (!userIsAdminLevel || hasAnotherAdmin) {
                    if (
                        [...room.localParticipant.videoTrackPublications.values()].some(
                            (publication) => publication.source === Track.Source.ScreenShare
                        )
                    ) {
                        dispatch(setPopupStateValue({ popup: PopUpControls.ScreenShareLeaveWarning, value: true }));
                    } else {
                        dispatch(setPopupStateValue({ popup: PopUpControls.LeaveMeetingParticipant, value: true }));
                    }
                    return false;
                } else if (userIsAdminLevel && !hasAnotherAdmin) {
                    dispatch(setPopupStateValue({ popup: PopUpControls.LeaveMeeting, value: true }));
                    return false;
                } else {
                    dispatch(setPopupStateValue({ popup: PopUpControls.LeaveMeetingParticipant, value: true }));
                    return false;
                }
            }

            return undefined;
        });

        return () => {
            unblock();
        };
    }, [joinedRoom, isLocalParticipantHost, isLocalParticipantAdminLevelUser, hasAnotherAdmin, history]);

    const getKeychainIndexInformation = useCallback(() => {
        return keyProvider.getKeychainIndexInformation() ?? [];
    }, [keyProvider]);

    if (openedInDesktopApp) {
        return <MeetingOpenedInDesktopApp />;
    }

    if (decryptionReadinessStatus === MeetingDecryptionReadinessStatus.UNINITIALIZED) {
        return null;
    }

    return (
        <MLSContext.Provider value={{ mls: wasmApp }}>
            <div className="h-full w-full">
                {decryptionReadinessStatus === MeetingDecryptionReadinessStatus.INITIALIZED && (
                    <PasswordPrompt
                        password={password}
                        setPassword={setPassword}
                        onPasswordSubmit={submitPassword}
                        invalidPassphrase={invalidPassphrase}
                    />
                )}
                {isMeetingLockedModalOpen && <MeetingLockedModal onClose={() => setIsMeetingLockedModalOpen(false)} />}
                {joinedRoom && room && displayName ? (
                    <MeetContainer
                        displayName={displayName}
                        handleLeave={handleLeave}
                        handleEndMeeting={handleEndMeeting}
                        shareLink={shareLink}
                        roomName={displayRoomName as string}
                        participantNameMap={participantNameMap}
                        participantsMap={participantsMap}
                        passphrase={password}
                        handleMeetingLockToggle={handleMeetingLockToggle}
                        isDisconnected={connectionLost}
                        startPiP={startPiP}
                        stopPiP={stopPiP}
                        pictureInPictureWarmup={pictureInPictureWarmup}
                        pipCleanup={pipCleanup}
                        preparePictureInPicture={preparePictureInPicture}
                        locked={meetingDetails.locked}
                        maxDuration={meetingDetails.maxDuration}
                        maxParticipants={meetingDetails.maxParticipants}
                        instantMeeting={instantMeetingRef.current}
                        assignHost={assignHost}
                        paidUser={paidUser}
                        isRecordingInProgress={isRecordingInProgress}
                        getKeychainIndexInformation={getKeychainIndexInformation}
                        expirationTime={meetingDetails.expirationTime}
                        isGuestAdmin={isGuestAdminRef.current}
                        isUsingTurnRelay={isUsingTurnRelay}
                        liveKitConnectionState={liveKitConnectionState}
                        showReconnectedMessage={showReconnectedMessage}
                        setShowReconnectedMessage={setShowReconnectedMessage}
                        setLiveKitConnectionState={setLiveKitConnectionState}
                    />
                ) : (
                    <PrejoinContainer
                        handleJoin={instantMeetingRef.current ? joinInstantMeeting : joinMeeting}
                        loadingState={LoadingState.JoiningInProgress}
                        isLoading={joiningInProgress}
                        shareLink={shareLink}
                        roomName={displayRoomName as string}
                        roomId={token}
                        instantMeeting={instantMeetingRef.current}
                        participantsCount={prejoinParticipantCount}
                        displayName={displayName}
                        setDisplayName={setDisplayName}
                        isInstantJoin={isInstantJoin}
                        isPersonalRoom={isPersonalRoom}
                        isLoadingMeetings={isLoadingMeetings}
                        joiningLoaderHeader={joiningLoaderHeader}
                        joiningLoaderSubtitle={joiningLoaderSubtitle}
                        userId={user?.ID}
                    />
                )}
                {isWebRtcUnsupportedModalOpen && (
                    <WebRtcUnsupportedModal onClose={() => setIsWebRtcUnsupportedModalOpen(false)} />
                )}
                {connectionLost && (
                    <ConnectionLostModal
                        onClose={() => {
                            void wasmApp
                                ?.triggerWebSocketReconnect()
                                .catch((error) =>
                                    reportMeetError(
                                        'Failed to trigger websocket reconnect',
                                        withMeetingLinkNameTag(error)
                                    )
                                );
                            setConnectionLost(false);
                        }}
                        onLeave={() => {
                            handleUngracefulLeave();
                            setConnectionLost(false);
                        }}
                    />
                )}
                {isConnectionFailedModalOpen && (
                    <ConnectionFailedModal
                        onTryAgain={() => {
                            setIsConnectionFailedModalOpen(false);
                        }}
                        onLeave={() => {
                            setIsConnectionFailedModalOpen(false);
                            history.push('/dashboard');
                        }}
                        showLeaveButton={!isGuest}
                    />
                )}
                {joinedRoom && !!canvas && isPipActive && isFirefox() ? (
                    <PiPPreviewVideo
                        canvas={canvas}
                        onClose={() => {
                            void stopPiP();
                        }}
                        tracksLength={tracksLength}
                    />
                ) : null}
            </div>
        </MLSContext.Provider>
    );
};

export const ProtonMeetContainerWithUser = (
    props: Omit<ProtonMeetContainerProps, 'user' | 'paidUser' | 'isSubUser'>
) => {
    const [user] = useUser();

    const { isPaid, isSubUser } = useIsTreatedAsPaidMeetUser();

    return <ProtonMeetContainer {...props} user={user} paidUser={isPaid} isSubUser={isSubUser} />;
};

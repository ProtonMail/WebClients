import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { type GroupKeyInfo, MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { type Room, Track } from 'livekit-client';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { useCreateInstantMeeting } from '@proton/meet/hooks/useCreateInstantMeeting';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { hasVisionary } from '@proton/payments';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { isWebRtcSupported } from '@proton/shared/lib/helpers/isWebRtcSupported';
import { wait } from '@proton/shared/lib/helpers/promise';
import { CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';
import useFlag from '@proton/unleash/useFlag';

import { ConnectionLostModal } from '../../components/ConnectionLostModal/ConnectionLostModal';
import { MeetingLockedModal } from '../../components/MeetingLockedModal/MeetingLockedModal';
import { PasswordPrompt } from '../../components/PasswordPrompt/PasswordPrompt';
import { PiPPreviewVideo } from '../../components/PiPPreviewVideo/PiPPreviewVideo';
import { WebRtcUnsupportedModal } from '../../components/WebRtcUnsupportedModal/WebRtcUnsupportedModal';
import { MEETING_LOCKED_ERROR_CODE } from '../../constants';
import { MLSContext } from '../../contexts/MLSContext';
import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useWasmApp } from '../../contexts/WasmContext';
import type { SRPHandshakeInfo } from '../../hooks/srp/useMeetSrp';
import { useMeetingSetup } from '../../hooks/srp/useMeetingSetup';
import { useAssignHost } from '../../hooks/useAssignHost';
import { useConnectionHealthCheck } from '../../hooks/useConnectionHealthCheck';
import { defaultDisplayNameHooks } from '../../hooks/useDefaultDisplayName';
import { useDependencySetup } from '../../hooks/useDependencySetup';
import { useIsRecordingInProgress } from '../../hooks/useMeetingRecorder/useIsRecordingInProgress';
import { useParticipantNameMap } from '../../hooks/useParticipantNameMap';
import { usePictureInPicture } from '../../hooks/usePictureInPicture/usePictureInPicture';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useMeetDispatch } from '../../store/hooks';
import { setPreviousMeetingLink, setUpsellModalType } from '../../store/slices/meetAppStateSlice';
import { toggleMeetingLockThunk } from '../../store/slices/settings';
import type { DecryptionErrorLog, KeyRotationLog, MLSGroupState, MeetChatMessage } from '../../types';
import { LoadingState, PopUpControls, UpsellModalTypes } from '../../types';
import type { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { KeyRotationScheduler } from '../../utils/SeamlessKeyRotationScheduler';
import { isLocalParticipantAdmin } from '../../utils/isLocalParticipantAdmin';
import { setupLiveKitAdminChangeEvent, setupWasmDependencies } from '../../utils/wasmUtils';
import { MeetContainer } from '../MeetContainer';
import { PrejoinContainer } from '../PrejoinContainer/PrejoinContainer';

enum MeetingDecryptionReadinessStatus {
    UNINITIALIZED = 'uninitialized',
    INITIALIZED = 'initialized',
    READY_TO_DECRYPT = 'readyToDecrypt',
}

interface ProtonMeetContainerProps {
    guestMode?: boolean;
    room: Room;
    keyProvider: ProtonMeetKeyProvider;
    user?: UserModel | null;
    hasSubscription: boolean;
    keyRotationLogs: KeyRotationLog[];
    setKeyRotationLogs: React.Dispatch<React.SetStateAction<KeyRotationLog[]>>;
    decryptionErrorLogs: DecryptionErrorLog[];
}

export const ProtonMeetContainer = ({
    guestMode = false,
    room,
    keyProvider,
    user = null,
    hasSubscription = false,
    keyRotationLogs,
    setKeyRotationLogs,
    decryptionErrorLogs,
}: ProtonMeetContainerProps) => {
    const dispatch = useMeetDispatch();

    const promptOnTabClose = useFlag('MeetPromptOnTabClose');
    const showUpsellModalAfterMeeting = useFlag('MeetShowUpsellModalAfterMeeting');
    const meetUpsellEnabled = useFlag('MeetUpsell');

    useWakeLock();

    useDependencySetup(guestMode);

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const instantJoinParam = searchParams.get('instantJoin');

    const [isInstantJoin, setIsInstantJoin] = useState(instantJoinParam === 'true');

    const { initializeDevices } = useMediaManagementContext();

    const { setMeetingReadyPopupOpen } = useUIStateContext();

    const authentication = useAuthentication();
    const { createNotification } = useNotifications();

    const reportMeetError = useMeetErrorReporting();

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

    const { getMeetingDetails, initHandshake, token, urlPassword, getAccessDetails } = useMeetingSetup();

    const { setPopupStateValue } = useUIStateContext();

    const instantMeetingRef = useRef(!token);

    const useDefaultDisplayName = guestMode
        ? defaultDisplayNameHooks.unauthenticated
        : defaultDisplayNameHooks.authenticated;
    const defaultDisplayName = useDefaultDisplayName();

    const [displayName, setDisplayName] = useState(defaultDisplayName);

    const [joiningInProgress, setJoiningInProgress] = useState(false);
    const [joinedRoom, setJoinedRoom] = useState(false);

    const [meetingDetails, setMeetingDetails] = useState({
        meetingId: token,
        meetingPassword: urlPassword,
        meetingName: '',
        locked: false,
        maxDuration: 0,
        maxParticipants: 0,
    });

    const [connectionLost, setConnectionLost] = useState(false);

    const [chatMessages, setChatMessages] = useState<MeetChatMessage[]>([]);

    const accessTokenRef = useRef<string | null>(null);

    const { getParticipants, participantNameMap, participantsMap, resetParticipantNameMap, updateAdminParticipant } =
        useParticipantNameMap();

    const { stopPiP, startPiP, isPipActive, canvas, tracksLength, pipSetup, pipCleanup, preparePictureInPicture } =
        usePictureInPicture({
            isDisconnected: connectionLost,
            participantNameMap,
            chatMessages,
        });

    const isRecordingInProgress = useIsRecordingInProgress();

    const [initialisedParticipantNameMap, setInitialisedParticipantNameMap] = useState(false);

    const joinBlockedRef = useRef(false);
    const lastEpochRef = useRef<bigint | null>(null);
    const refetchedParticipantNameMapRef = useRef(false);
    const joinedRoomLoggedRef = useRef(false);

    const loadingStartTimeRef = useRef(0);
    const [mlsGroupState, setMlsGroupState] = useState<MLSGroupState | null>(null);
    const mlsGroupStateRef = useRef(mlsGroupState);

    const wasmApp = useWasmApp();

    const mlsSetupDone = useRef(false);
    const startHealthCheck = useRef(false);
    const meetingLinkRef = useRef<string | null>(null);

    const notifications = useNotifications();

    const keyRotationSchedulerRef = useRef(new KeyRotationScheduler(keyProvider));

    const isMeetNewJoinTypeEnabled = useFlag('MeetNewJoinType');
    const isMeetSeamlessKeyRotationEnabled = useFlag('MeetSeamlessKeyRotationEnabled');
    const isMeetClientMetricsLogEnabled = useFlag('MeetClientMetricsLog');

    useConnectionHealthCheck({
        wasmApp,
        mlsGroupStateRef,
        startHealthCheck,
        setConnectionLost,
        reportMeetError,
    });

    const treatedAsPaidUser = hasSubscription || !!user?.hasPaidMeet;

    const {
        isLocalParticipantHost,
        isLocalParticipantAdmin: isLocalParticipantAdminLevelUser,
        hasAnotherAdmin,
    } = isLocalParticipantAdmin(participantsMap, room.localParticipant);

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
            reportMeetError('Lower epoch than last epoch', { epoch });
        }

        if (epoch && lastEpochRef.current && lastEpochRef.current + 1n !== epoch) {
            reportMeetError('Epoch is not the next epoch', { epoch });
        }

        if (!key) {
            reportMeetError('Key is undefined', { epoch });
        }

        if (!epoch) {
            reportMeetError('Epoch is undefined', {});
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
                epoch: newGroupKeyInfo.epoch,
            };
            setMlsGroupState(nextMlsGroupState);
            mlsGroupStateRef.current = nextMlsGroupState;
            return { key: newGroupKeyInfo.key, epoch: newGroupKeyInfo.epoch };
        } catch (err: any) {
            reportMeetError('Error while calling getGroupKeyInfo', err);
            throw err;
        }
    };

    const onNewGroupKeyInfo = async (key: string, epoch: bigint) => {
        try {
            reportMLSRelatedError(key, epoch);
            if (isMeetSeamlessKeyRotationEnabled) {
                await keyRotationSchedulerRef.current.schedule(key, epoch);
            } else {
                await keyProvider.setKeyWithEpoch(key, epoch);
            }

            const displayCode = await wasmApp?.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: epoch,
            };
            setMlsGroupState(nextMlsGroupState);
            mlsGroupStateRef.current = nextMlsGroupState;

            if (isMeetClientMetricsLogEnabled) {
                try {
                    await wasmApp?.tryLogDesignatedCommitter(Number(epoch));
                } catch (error) {
                    reportMeetError('Failed to log designated committer rank', error);
                }
            }

            const errorMessage = hasEpochError(epoch);

            const newLog = {
                timestamp: Date.now(),
                epoch: Number(epoch),
                type: errorMessage ? 'error' : 'log',
                message: errorMessage ?? 'Key rotation successful',
            };

            setKeyRotationLogs((prev) => [...prev, newLog as KeyRotationLog]);

            lastEpochRef.current = epoch;
        } catch (err) {
            setKeyRotationLogs((prev) => [
                ...prev,
                {
                    timestamp: Date.now(),
                    epoch: Number(epoch),
                    type: 'error',
                    message: 'Could not set new encryption key',
                },
            ]);
            reportMeetError('Could not set new encryption key', err);
        }
    };

    const handleMlsSetup = async (meetingLinkName: string, accessToken: string) => {
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

            if (isMeetNewJoinTypeEnabled) {
                // eslint-disable-next-line no-console
                console.log('Joining room with proposal');
                try {
                    await wasmApp.joinRoomWithProposal(accessToken, meetingLinkName, sessionId);
                } catch (error) {
                    // fallback to join with external commit
                    await wasmApp.joinMeetingWithAccessToken(accessToken, meetingLinkName, sessionId);
                }
            } else {
                await wasmApp.joinMeetingWithAccessToken(accessToken, meetingLinkName, sessionId);
            }

            await wasmApp.setMlsGroupUpdateHandler();
            await wasmApp.setLiveKitAdminChangeHandler();

            const groupKeyData = await wasmApp.getGroupKey();

            currentKeyRef.current = groupKeyData.key;

            const displayCode = await wasmApp?.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: groupKeyData.epoch,
            };
            setMlsGroupState(nextMlsGroupState);
            mlsGroupStateRef.current = nextMlsGroupState;

            startHealthCheck.current = true;

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
            void wasmApp.logConnectionLost().catch((error) => reportMeetError('Failed to log connection lost', error));
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

            if (!guestMode) {
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

    const handleJoin = async (displayName: string, meetingToken: string = token) => {
        setDisplayName(displayName);

        try {
            await getParticipants(meetingToken);
            setInitialisedParticipantNameMap(true);

            const sanitizedParticipantName = sanitizeMessage(displayName);

            const { websocketUrl, accessToken } = await getAccessDetails({
                displayName: sanitizedParticipantName,
                token: meetingToken,
            });

            accessTokenRef.current = accessToken;

            const { key: groupKey, epoch } = (await handleMlsSetup(meetingToken, accessToken)) || {};

            reportMLSRelatedError(groupKey, epoch);

            if (!groupKey || !epoch) {
                throw new Error('Group key or epoch is missing');
            }

            setKeyRotationLogs((prev) => [
                ...prev,
                {
                    timestamp: Date.now(),
                    epoch: Number(epoch),
                    type: 'log',
                    message: 'Key rotation successful',
                },
            ]);

            if (isMeetSeamlessKeyRotationEnabled) {
                // eslint-disable-next-line no-console
                console.log('Enabled seamless key rotation');
                await keyRotationSchedulerRef.current.schedule(groupKey, epoch);
            } else {
                await keyProvider.setKeyWithEpoch(groupKey, epoch);
            }
            // Turning auto subscribe off so we have better control over the quality of the tracks
            try {
                await room.connect(websocketUrl, accessToken, {
                    autoSubscribe: false,
                });
            } catch (livekitError) {
                // If LiveKit connection fails after MLS join, clean up MLS group to prevent inconsistent state
                try {
                    await wasmApp?.leaveMeeting();
                } catch (leaveError) {
                    reportMeetError('Failed to leave MLS group after LiveKit connection failure', leaveError);
                }
                mlsSetupDone.current = false;
                startHealthCheck.current = false;
                if (isMeetSeamlessKeyRotationEnabled) {
                    keyRotationSchedulerRef.current.clean();
                } else {
                    keyProvider.cleanCurrent();
                }
                throw livekitError;
            }

            await room.setE2EEEnabled(true);

            await getParticipants(meetingToken);

            // In case of mobile devices we need to set these states early, as the camera preview being active while initializing the devices for LiveKit causes issues.
            if (isMobile()) {
                setJoinedRoom(true);
                setJoiningInProgress(false);
                await wait(50);
            }

            await initializeDevices();

            const originalOnTokenRefresh = room.engine.client.onTokenRefresh;

            room.engine.client.onTokenRefresh = (token) => {
                updateAccessToken(token);
                originalOnTokenRefresh?.(token);
            };

            room.on('disconnected', () => {
                instantMeetingRef.current = false;
                mlsSetupDone.current = false;
                startHealthCheck.current = false;

                setInitialisedParticipantNameMap(false);
                setJoinedRoom(false);
                joinedRoomLoggedRef.current = false;
                void stopPiP();
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
                    reportMeetError('Failed to log joined room', error);
                }
            }
        } catch (error: any) {
            reportMeetError('Failed to join meeting', error);

            setJoiningInProgress(false);
            joinBlockedRef.current = false;

            const { code } = getApiError(error);

            // Log failed room join
            if (isMeetClientMetricsLogEnabled) {
                try {
                    await wasmApp?.logJoinedRoomFailed(code ? String(code) : undefined);
                } catch (logError) {
                    reportMeetError('Failed to log joined room failed', logError);
                }
            }

            if (code === MEETING_LOCKED_ERROR_CODE) {
                await handleMeetingIsLockedError();
                return;
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
                isGuest: guestMode,
                isPaidUser: treatedAsPaidUser,
            });

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

            setMeetingDetails({
                meetingId: id,
                meetingPassword: passwordBase,
                meetingName: roomName,
                locked,
                maxDuration,
                maxParticipants,
            });

            setMeetingReadyPopupOpen(true);

            await handleJoin(displayName, id);

            meetingLinkRef.current = getMeetingLink(id, passwordBase);

            history.push(meetingLinkRef.current);
        } catch (error: any) {
            reportMeetError('Failed to create instant meeting', error);
            setJoiningInProgress(false);
        }

        joinBlockedRef.current = false;
    };

    const joinMeeting = async (displayName: string, meetingToken: string = token) => {
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

            await handleJoin(displayName, meetingToken);

            meetingLinkRef.current = getMeetingLink(token, urlPassword);
        } catch (error: any) {
            reportMeetError('Failed to join meeting', error);
            setJoiningInProgress(false);
        }

        joinBlockedRef.current = false;
    };

    const setup = async () => {
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
            if (guestMode) {
                history.push(meetingLinkRef.current as string);
            } else {
                history.push('/dashboard');
            }
            return;
        }

        dispatch(setPreviousMeetingLink(meetingLinkRef.current));

        if (guestMode) {
            dispatch(setUpsellModalType(UpsellModalTypes.Schedule));
            history.push('/anonymous');
            return;
        }

        if (user && !treatedAsPaidUser) {
            dispatch(setUpsellModalType(UpsellModalTypes.FreeAccount));
        }

        if (user && treatedAsPaidUser) {
            dispatch(setUpsellModalType(UpsellModalTypes.PaidAccount));
        }

        history.push('/dashboard');
    };

    const handleLeave = () => {
        instantMeetingRef.current = false;
        void room.disconnect();
        resetParticipantNameMap();
        void wasmApp?.leaveMeeting();
        void stopPiP();
        mlsSetupDone.current = false; // need to set mls again after leave meeting
        startHealthCheck.current = false;

        if (isMeetSeamlessKeyRotationEnabled) {
            // clean the current key and epoch to avoid use them in next meeting
            keyRotationSchedulerRef.current.clean();
        }

        setInitialisedParticipantNameMap(false);
        setJoinedRoom(false);

        keyProvider.cleanCurrent();

        prepareUpsell();
    };

    const handleEndMeeting = async () => {
        if (!wasmApp) {
            return;
        }

        try {
            await wasmApp.endMeeting();
        } catch (err) {
            reportMeetError('Unable to end meeting for all', err);
        }

        // Always perform cleanup regardless of endMeeting success/failure
        instantMeetingRef.current = false;
        resetParticipantNameMap();
        mlsSetupDone.current = false; // need to set mls again after leave meeting
        setInitialisedParticipantNameMap(false);
        setJoinedRoom(false);

        keyProvider.cleanCurrent();

        prepareUpsell();
    };

    const handleMeetingLockToggle = async () => {
        await dispatch(
            toggleMeetingLockThunk({ meetingLinkName: token, accessToken: accessTokenRef.current as string })
        );
    };

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
                    reportMeetError('Error leaving meeting', error);
                }
            }
        };

        window.addEventListener('unload', handleUnload);
        return () => {
            window.removeEventListener('unload', handleUnload);
        };
    }, [joinedRoom, room, wasmApp, reportMeetError]);

    useEffect(() => {
        if (refetchedParticipantNameMapRef.current) {
            return;
        }

        if (joinedRoom && room && !participantNameMap[room.localParticipant.identity as string]) {
            refetchedParticipantNameMapRef.current = true;
            void getParticipants(token);
        }
    }, [getParticipants, token, participantNameMap, joinedRoom]);

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
                        setPopupStateValue(PopUpControls.ScreenShareLeaveWarning, true);
                        return false;
                    }
                    handleLeave();
                } else if (userIsAdminLevel && !hasAnotherAdmin) {
                    setPopupStateValue(PopUpControls.LeaveMeeting, true);
                    return false;
                }

                return false;
            }

            return undefined;
        });

        return () => {
            unblock();
        };
    }, [joinedRoom, isLocalParticipantHost, isLocalParticipantAdminLevelUser, hasAnotherAdmin, history]);

    if (decryptionReadinessStatus === MeetingDecryptionReadinessStatus.UNINITIALIZED) {
        return null;
    }

    const shareLink = `${window.location.origin}${getMeetingLink(
        meetingDetails.meetingId,
        meetingDetails.meetingPassword
    )}`;

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
                        roomName={meetingDetails.meetingName as string}
                        participantNameMap={participantNameMap}
                        participantsMap={participantsMap}
                        getParticipants={() => getParticipants(meetingDetails.meetingId as string)}
                        passphrase={password}
                        guestMode={guestMode}
                        handleMeetingLockToggle={handleMeetingLockToggle}
                        mlsGroupState={mlsGroupState}
                        isDisconnected={connectionLost}
                        startPiP={startPiP}
                        stopPiP={stopPiP}
                        chatMessages={chatMessages}
                        setChatMessages={setChatMessages}
                        pipSetup={pipSetup}
                        pipCleanup={pipCleanup}
                        preparePictureInPicture={preparePictureInPicture}
                        locked={meetingDetails.locked}
                        maxDuration={meetingDetails.maxDuration}
                        maxParticipants={meetingDetails.maxParticipants}
                        instantMeeting={instantMeetingRef.current}
                        assignHost={assignHost}
                        paidUser={treatedAsPaidUser}
                        keyRotationLogs={keyRotationLogs}
                        isRecordingInProgress={isRecordingInProgress}
                        getKeychainIndexInformation={() => keyProvider.getKeychainIndexInformation() ?? []}
                        decryptionErrorLogs={decryptionErrorLogs}
                    />
                ) : (
                    <PrejoinContainer
                        handleJoin={instantMeetingRef.current ? joinInstantMeeting : joinMeeting}
                        loadingState={LoadingState.JoiningInProgress}
                        isLoading={joiningInProgress}
                        guestMode={guestMode}
                        shareLink={shareLink}
                        roomName={meetingDetails.meetingName as string}
                        roomId={token}
                        instantMeeting={instantMeetingRef.current}
                        initialisedParticipantNameMap={initialisedParticipantNameMap}
                        participantNameMap={participantNameMap}
                        displayName={displayName}
                        setDisplayName={setDisplayName}
                        isInstantJoin={isInstantJoin}
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
                                .catch((error) => reportMeetError('Failed to trigger websocket reconnect', error));
                            setConnectionLost(false);
                        }}
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

export const ProtonMeetContainerWithUser = (props: Omit<ProtonMeetContainerProps, 'user' | 'hasSubscription'>) => {
    const [user] = useUser();
    const [subscription] = useSubscription();

    const hasSubscription = hasVisionary(subscription);

    return <ProtonMeetContainer {...props} user={user} hasSubscription={hasSubscription} />;
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useRoomContext } from '@livekit/components-react';
import { RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { Track } from 'livekit-client';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { resetMeetingState } from '@proton/meet/store/resetMeetingState';
import {
    selectIsReconnecting,
    selectJoinedRoom,
    selectMlsRetrying,
    selectPrejoinParticipantCount,
    selectReconnectionFailed,
    setReconnectionFailed,
} from '@proton/meet/store/slices/connectionSlice';
import { selectMeetingLinkName, selectMeetingPassword } from '@proton/meet/store/slices/currentMeeting';
import { setPreviousMeetingLink, setUpsellModalType } from '@proton/meet/store/slices/meetAppStateSlice';
import {
    selectHasAnotherAdmin,
    selectIsGuestAdmin,
    selectIsLocalParticipantAdminOrHost,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { toggleMeetingLockThunk } from '@proton/meet/store/slices/settings';
import { PopUpControls, setPopupStateValue } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus, selectUserId } from '@proton/meet/store/slices/userSlice';
import { UpsellModalTypes } from '@proton/meet/types/types';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { useFlag } from '@proton/unleash/useFlag';

import { ConnectionFailedModal } from '../../components/ConnectionFailedModal/ConnectionFailedModal';
import { ConnectionLostModal } from '../../components/ConnectionLostModal/ConnectionLostModal';
import { MeetingLockedModal } from '../../components/MeetingLockedModal/MeetingLockedModal';
import { MeetingOpenedInDesktopApp } from '../../components/MeetingOpenedInDesktopApp/MeetingOpenedInDesktopApp';
import { PiPPreviewVideo } from '../../components/PiPPreviewVideo/PiPPreviewVideo';
import { WebRtcUnsupportedModal } from '../../components/WebRtcUnsupportedModal/WebRtcUnsupportedModal';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { MeetingRecorderProvider } from '../../contexts/MeetingRecorderContext';
import { WaitingRoomProvider } from '../../contexts/WaitingRoomContext';
import { useIsRecordingInProgressReceiver } from '../../hooks/bridges/useIsRecordingInProgressReceiver';
import { useDesktopAppRedirect } from '../../hooks/protonMeetContainer/useDesktopAppRedirect';
import { useJoinFlow } from '../../hooks/protonMeetContainer/useJoinFlow';
import { useMeetingCleanup } from '../../hooks/protonMeetContainer/useMeetingCleanup';
import { useMeetingConnection } from '../../hooks/protonMeetContainer/useMeetingConnection';
import { useMeetingErrorContext } from '../../hooks/protonMeetContainer/useMeetingErrorContext';
import { useMeetingInfoHydration } from '../../hooks/protonMeetContainer/useMeetingInfoHydration';
import { useMlsSession } from '../../hooks/protonMeetContainer/useMlsSession';
import { useRoomEventHandlers } from '../../hooks/protonMeetContainer/useRoomEventHandlers';
import { useMeetingSetup } from '../../hooks/srp/useMeetingSetup';
import { useAssignHost } from '../../hooks/useAssignHost';
import { useConnectionHealthCheck } from '../../hooks/useConnectionHealthCheck';
import { useDisplayName } from '../../hooks/useDisplayName';
import { useKeyManagement } from '../../hooks/useKeyManagement';
import { useLiveKitConnection } from '../../hooks/useLiveKitConnection';
import { useParticipantNameMap } from '../../hooks/useParticipantNameMap';
import { usePictureInPicture } from '../../hooks/usePictureInPicture/usePictureInPicture';
import { useSafariWebsocketVisibilityHandler } from '../../hooks/useSafariWebsocketVisibilityHandler';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useWakeLock } from '../../hooks/useWakeLock';
import type { JoinLocationState } from '../../types';
import type { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { cleanupWasmDependencies } from '../../utils/wasmUtils';
import { MeetContainer } from '../MeetContainer';
import { PrejoinContainer } from '../PrejoinContainer/PrejoinContainer';

interface ProtonMeetContainerProps {
    keyProvider: ProtonMeetKeyProvider;
    user?: UserModel | null;
}

export const ProtonMeetContainer = ({ keyProvider }: ProtonMeetContainerProps) => {
    const dispatch = useMeetDispatch();
    const isGuest = useMeetSelector(selectIsGuest);
    const userId = useMeetSelector(selectUserId);
    const { isPaidUser, isSubUser } = useMeetSelector(selectSubscriptionStatus);
    const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);
    const hasAnotherAdmin = useMeetSelector(selectHasAnotherAdmin);

    const promptOnTabClose = useFlag('MeetPromptOnTabClose');
    const showUpsellModalAfterMeeting = useFlag('MeetShowUpsellModalAfterMeeting');
    const meetUpsellEnabled = useFlag('MeetUpsell');

    useWakeLock();

    const location = useLocation<JoinLocationState | undefined>();

    const [isInstantJoin, setIsInstantJoin] = useState(location.state?.instantJoin === true);

    const { initializeDevices } = useMediaManagementContext();

    const { meetingLinkNameRef, withMeetingLinkNameTag, reportMeetError, clearSentryReportErrorCounts } =
        useMeetingErrorContext();

    const {
        connectWithStunFallbackToTurnRelay,
        isUsingTurnRelay,
        joiningLoaderHeader,
        joiningLoaderSubtitle,
        clearLoaderState,
    } = useLiveKitConnection({ reportMeetError, withMeetingLinkNameTag });

    const history = useHistory();

    const [isMeetingLockedModalOpen, setIsMeetingLockedModalOpen] = useState(false);
    const [isWebRtcUnsupportedModalOpen, setIsWebRtcUnsupportedModalOpen] = useState(false);
    const [isConnectionFailedModalOpen, setIsConnectionFailedModalOpen] = useState(false);

    const { token, urlPassword } = useMeetingSetup();

    const instantMeetingRef = useRef(!token);

    const { openedInDesktopApp } = useDesktopAppRedirect({ token, isInstantJoin });

    const { isReadyToDecrypt } = useMeetingInfoHydration({
        meetingLinkName: token,
        meetingPassword: urlPassword,
        instantMeeting: instantMeetingRef.current,
    });

    const { displayName, setDisplayName } = useDisplayName({ isGuest, userId, isInstantJoin });

    const joinedRoom = useMeetSelector(selectJoinedRoom);
    const isReconnecting = useMeetSelector(selectIsReconnecting);
    const reconnectionFailed = useMeetSelector(selectReconnectionFailed);
    const mlsRetrying = useMeetSelector(selectMlsRetrying);
    const prejoinParticipantCount = useMeetSelector(selectPrejoinParticipantCount);

    const meetingLinkName = useMeetSelector(selectMeetingLinkName);
    const meetingPassword = useMeetSelector(selectMeetingPassword);

    const isGuestAdmin = useMeetSelector(selectIsGuestAdmin);

    // Stable ref to break the circular dependency between useConnectionHealthCheck and performFullReconnection
    const triggerFullReconnectionRef = useRef<(reason: RejoinReasonInfo) => void>(() => {});

    const accessTokenRef = useRef<string | null>(null);
    const decryptionKeyRef = useRef<CryptoKey | null>(null);

    const { getParticipants, updateAdminParticipant, getQueryParticipantsCount } = useParticipantNameMap(
        meetingLinkName,
        decryptionKeyRef
    );

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
        isDisconnected: isReconnecting || reconnectionFailed,
    });

    const joinedRoomLoggedRef = useRef(false);

    const meetCoreClient = useMeetCoreClient();
    const room = useRoomContext();

    const meetingLinkRef = useRef<string | null>(null);
    const isExpiringRef = useRef(false);

    useIsRecordingInProgressReceiver();

    const isMeetSeamlessKeyRotationEnabled = useFlag('MeetSeamlessKeyRotationEnabled');

    const {
        keyRotationScheduler,
        currentKeyRef,
        lastEpochRef,
        mlsGroupStateRef,
        getGroupKeyInfo,
        onNewGroupKeyInfo,
        reportMLSRelatedError,
    } = useKeyManagement({
        keyProvider,
        withMeetingLinkNameTag,
    });

    const { allowHealthCheck, disallowHealthCheck } = useConnectionHealthCheck({
        mlsGroupStateRef,
        onMlsFailed: () => triggerFullReconnectionRef.current(RejoinReasonInfo.EpochMismatch),
    });

    const { mlsSetupDone, handleMlsSetup } = useMlsSession({
        getGroupKeyInfo,
        onNewGroupKeyInfo,
        updateAdminParticipant,
        allowHealthCheck,
        triggerFullReconnectionRef,
        currentKeyRef,
        mlsGroupStateRef,
    });

    const cleanupMlsState = useCallback(() => {
        mlsSetupDone.current = false;
        cleanupWasmDependencies();
        if (isMeetSeamlessKeyRotationEnabled) {
            keyRotationScheduler.clean();
        } else {
            keyProvider.cleanCurrent();
        }
        lastEpochRef.current = null;
    }, [isMeetSeamlessKeyRotationEnabled, keyRotationScheduler, keyProvider, lastEpochRef, mlsSetupDone]);

    const { cleanupMeeting } = useMeetingCleanup({
        instantMeetingRef,
        meetingLinkNameRef,
        decryptionKeyRef,
        disallowHealthCheck,
        cleanupMlsState,
        stopPiP,
    });

    useSafariWebsocketVisibilityHandler({
        joinedRoom,
    });

    const assignHost = useAssignHost(accessTokenRef.current as string, token);

    const { isReconnectingRef, websocketUrlRef, performFullReconnection, connectWithMls } = useMeetingConnection({
        meetingLinkNameRef,
        meetingPassword,
        displayName,
        decryptionKeyRef,
        mlsSetupDone,
        accessTokenRef,
        keyProvider,
        keyRotationScheduler,
        handleMlsSetup,
        reportMLSRelatedError,
        connectWithStunFallbackToTurnRelay,
        cleanupMlsState,
        allowHealthCheck,
        disallowHealthCheck,
        initializeDevices,
        getParticipants,
        getQueryParticipantsCount,
        reportMeetError,
        withMeetingLinkNameTag,
        triggerFullReconnectionRef,
    });

    const { liveKitConnectionState, setLiveKitConnectionState, showReconnectedMessage, setShowReconnectedMessage } =
        useRoomEventHandlers({
            joinedRoom,
            disallowHealthCheck,
            cleanupMlsState,
            stopPiP,
            joinedRoomLoggedRef,
            instantMeetingRef,
            mlsSetupDone,
            isReconnectingRef,
            isExpiringRef,
            meetingLinkRef,
            meetingLinkNameRef,
            triggerFullReconnectionRef,
            reportMeetError,
            withMeetingLinkNameTag,
        });

    const { joinMeeting, joinInstantMeeting, waitingRoomProviderProps } = useJoinFlow({
        token,
        urlPassword,
        isInstantJoin,
        setDisplayName,
        connectWithMls,
        websocketUrlRef,
        decryptionKeyRef,
        accessTokenRef,
        meetingLinkRef,
        meetingLinkNameRef,
        isExpiringRef,
        joinedRoomLoggedRef,
        setIsWebRtcUnsupportedModalOpen,
        setIsMeetingLockedModalOpen,
        setIsConnectionFailedModalOpen,
        isUsingTurnRelay,
        reportMeetError,
        withMeetingLinkNameTag,
        displayName,
        cleanupMlsState,
        disallowHealthCheck,
    });

    useEffect(() => {
        return () => {
            dispatch(resetMeetingState());
        };
    }, [dispatch]);

    const prepareUpsell = () => {
        if (isExpiringRef.current) {
            return;
        }

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

        if (isLocalParticipantAdminOrHost && !isPaidUser) {
            dispatch(setUpsellModalType(UpsellModalTypes.HostFreeAccount));
        }

        if (isLocalParticipantAdminOrHost && (isPaidUser || isSubUser)) {
            dispatch(setUpsellModalType(UpsellModalTypes.HostPaidAccount));
        }

        if (!isLocalParticipantAdminOrHost && !isGuest && !isPaidUser) {
            dispatch(setUpsellModalType(UpsellModalTypes.FreeAccount));
        }

        if (!isLocalParticipantAdminOrHost && !isGuest && (isPaidUser || isSubUser)) {
            dispatch(setUpsellModalType(UpsellModalTypes.PaidAccount));
        }

        history.push('/dashboard');
    };

    const handleLeave = () => {
        cleanupMeeting({ disconnect: true });
        clearLoaderState();
        clearSentryReportErrorCounts();
        prepareUpsell();
    };

    const handleUngracefulLeave = () => {
        cleanupMeeting({ disconnect: true });
    };

    const handleEndMeeting = async () => {
        try {
            await meetCoreClient.endMeeting();
        } catch (err) {
            reportMeetError('Unable to end meeting for all', withMeetingLinkNameTag(err));
        }

        cleanupMeeting();
    };

    const handleMeetingExpired = async () => {
        dispatch(setPreviousMeetingLink(meetingLinkRef.current));
        if (isLocalParticipantAdminOrHost || isGuestAdmin) {
            isExpiringRef.current = true;
            dispatch(
                setUpsellModalType(
                    isPaidUser || isSubUser
                        ? UpsellModalTypes.MeetingExpiredHostPaid
                        : UpsellModalTypes.MeetingExpiredHostFree
                )
            );
            await handleEndMeeting();
        } else {
            handleLeave();
            dispatch(setUpsellModalType(UpsellModalTypes.MeetingEnded));
        }
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
    }, [joinedRoom, promptOnTabClose]);

    // Actually disconnect when page unloads (after user confirms)
    useEffect(() => {
        const handleUnload = () => {
            if (joinedRoom) {
                try {
                    void room.disconnect();
                    void meetCoreClient.leaveMeeting();
                } catch (error) {
                    reportMeetError('Error leaving meeting', withMeetingLinkNameTag(error));
                }
            }
        };

        window.addEventListener('unload', handleUnload);
        return () => {
            window.removeEventListener('unload', handleUnload);
        };
    }, [joinedRoom, room, meetCoreClient, reportMeetError, withMeetingLinkNameTag]);

    const handleInstantJoin = async () => {
        if (isInstantJoin) {
            await joinInstantMeeting(displayName);
        }

        setIsInstantJoin(false);
    };

    useEffect(() => {
        void handleInstantJoin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!joinedRoom) {
            return;
        }

        const unblock = history.block((_location, action) => {
            if (action === 'POP') {
                if (!isLocalParticipantAdminOrHost || hasAnotherAdmin) {
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
                } else if (isLocalParticipantAdminOrHost && !hasAnotherAdmin) {
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
    }, [
        joinedRoom,
        isLocalParticipantAdminOrHost,
        hasAnotherAdmin,
        history,
        dispatch,
        room.localParticipant.videoTrackPublications,
    ]);

    const getKeychainIndexInformation = useCallback(() => {
        return keyProvider.getKeychainIndexInformation() ?? [];
    }, [keyProvider]);

    if (openedInDesktopApp) {
        return <MeetingOpenedInDesktopApp />;
    }

    if (!isReadyToDecrypt) {
        return null;
    }

    return (
        <div className="h-full w-full">
            {isMeetingLockedModalOpen && <MeetingLockedModal onClose={() => setIsMeetingLockedModalOpen(false)} />}
            <WaitingRoomProvider {...waitingRoomProviderProps}>
                {(joinedRoom || isReconnecting || reconnectionFailed) && room && displayName ? (
                    <MeetingRecorderProvider>
                        <MeetContainer
                            displayName={displayName}
                            handleLeave={handleLeave}
                            handleEndMeeting={handleEndMeeting}
                            handleMeetingExpired={handleMeetingExpired}
                            handleMeetingLockToggle={handleMeetingLockToggle}
                            isDisconnected={isReconnecting || reconnectionFailed}
                            startPiP={startPiP}
                            stopPiP={stopPiP}
                            pictureInPictureWarmup={pictureInPictureWarmup}
                            pipCleanup={pipCleanup}
                            preparePictureInPicture={preparePictureInPicture}
                            instantMeeting={instantMeetingRef.current}
                            assignHost={assignHost}
                            getKeychainIndexInformation={getKeychainIndexInformation}
                            isUsingTurnRelay={isUsingTurnRelay}
                            liveKitConnectionState={liveKitConnectionState}
                            showReconnectedMessage={showReconnectedMessage}
                            setShowReconnectedMessage={setShowReconnectedMessage}
                            setLiveKitConnectionState={setLiveKitConnectionState}
                            isReconnecting={isReconnecting}
                            mlsRetrying={mlsRetrying}
                            onSimulateReconnection={() => dispatch(setReconnectionFailed(true))}
                            websocketUrl={websocketUrlRef.current}
                        />
                    </MeetingRecorderProvider>
                ) : (
                    <PrejoinContainer
                        handleJoin={instantMeetingRef.current ? joinInstantMeeting : joinMeeting}
                        roomId={token}
                        instantMeeting={instantMeetingRef.current}
                        participantsCount={prejoinParticipantCount}
                        displayName={displayName}
                        setDisplayName={setDisplayName}
                        isInstantJoin={isInstantJoin}
                        joiningLoaderHeader={joiningLoaderHeader}
                        joiningLoaderSubtitle={joiningLoaderSubtitle}
                    />
                )}
            </WaitingRoomProvider>

            {isWebRtcUnsupportedModalOpen && (
                <WebRtcUnsupportedModal onClose={() => setIsWebRtcUnsupportedModalOpen(false)} />
            )}
            {reconnectionFailed && (
                <ConnectionLostModal
                    onRejoin={() => {
                        dispatch(setReconnectionFailed(false));
                        void performFullReconnection(RejoinReasonInfo.Other);
                    }}
                    onLeave={() => {
                        dispatch(setReconnectionFailed(false));
                        handleUngracefulLeave();
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
    );
};

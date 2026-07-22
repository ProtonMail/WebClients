import { useEffect, useLayoutEffect, useMemo } from 'react';

import type { ConnectionState } from 'livekit-client';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { resetMeetingState } from '@proton/meet/store/resetMeetingState';
import {
    setMeetingInfo,
    startMeetingDurationTimer,
    stopMeetingDurationTimer,
} from '@proton/meet/store/slices/meetingInfo';
import { setIsGuestAdmin } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { AutoCloseMeetingModal } from '../components/AutoCloseMeetingModal/AutoCloseMeetingModal';
import { DebugOverlay, useDebugOverlay } from '../components/DebugOverlay/DebugOverlay';
import { MeetingAnnouncer } from '../components/MeetingAnnouncer/MeetingAnnouncer';
import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { DebugOverlayContext } from '../contexts/DebugOverlayContext';
import { MeetContext } from '../contexts/MeetContext';
import { useMeetingRecorderContext } from '../contexts/MeetingRecorderContext';
import { useMeetingTelemetry } from '../hooks/telemetry/useMeetingTelemetry';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';
import { useStableCallback } from '../hooks/useStableCallback';

interface MeetContainerProps {
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    displayName: string;
    handleLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    handleMeetingExpired: () => Promise<void>;
    shareLink: string;
    roomName: string;
    handleMeetingLockToggle: () => Promise<void>;
    isDisconnected: boolean;
    startPiP: () => void;
    stopPiP: () => void;
    pictureInPictureWarmup: () => void;
    pipCleanup: () => void;
    preparePictureInPicture: () => void;
    instantMeeting: boolean;
    assignHost: (participantUuid: string) => Promise<void>;
    getKeychainIndexInformation: () => (number | undefined)[];
    expirationTime: number | null;
    isGuestAdmin: boolean;
    isUsingTurnRelay: boolean;
    liveKitConnectionState: ConnectionState | null;
    showReconnectedMessage: boolean;
    setShowReconnectedMessage: React.Dispatch<React.SetStateAction<boolean>>;
    setLiveKitConnectionState: React.Dispatch<React.SetStateAction<ConnectionState | null>>;
    isReconnecting: boolean;
    mlsRetrying: boolean;
    onSimulateReconnection: () => void;
    websocketUrl: string | null;
}

export const MeetContainer = ({
    expirationTime,
    maxDuration,
    maxParticipants,
    displayName,
    handleLeave,
    handleEndMeeting,
    handleMeetingExpired,
    shareLink,
    roomName,
    handleMeetingLockToggle,
    isDisconnected,
    startPiP,
    stopPiP,
    pictureInPictureWarmup,
    pipCleanup,
    preparePictureInPicture,
    instantMeeting,
    assignHost,
    isGuestAdmin,
    getKeychainIndexInformation,
    isUsingTurnRelay,
    liveKitConnectionState,
    showReconnectedMessage,
    setShowReconnectedMessage,
    setLiveKitConnectionState,
    isReconnecting,
    mlsRetrying,
    onSimulateReconnection,
    websocketUrl,
}: MeetContainerProps) => {
    const debugOverlay = useDebugOverlay();
    const dispatch = useMeetDispatch();

    const { startScreenShare, stopScreenShare, screenShareParticipant, screenShareTrack } = useCurrentScreenShare({
        stopPiP,
        startPiP,
        preparePictureInPicture,
    });

    useLayoutEffect(() => {
        dispatch(
            setMeetingInfo({
                roomName,
                meetingLink: shareLink,
                maxDuration,
                maxParticipants,
                expirationTime,
                instantMeeting,
                displayName,
            })
        );
        dispatch(setIsGuestAdmin(isGuestAdmin));
    }, [
        dispatch,
        roomName,
        shareLink,
        maxDuration,
        maxParticipants,
        expirationTime,
        instantMeeting,
        displayName,
        isGuestAdmin,
    ]);

    useEffect(() => {
        if (!expirationTime) {
            return;
        }
        dispatch(startMeetingDurationTimer());
        return () => {
            dispatch(stopMeetingDurationTimer());
        };
    }, [dispatch, expirationTime]);

    useEffect(() => {
        return () => {
            dispatch(resetMeetingState());
        };
    }, [dispatch]);

    const totalParticipantCount = useMeetSelector(selectTotalParticipantCount);

    const { finishRecording } = useMeetingRecorderContext();

    const leaveWithStopRecording = useStableCallback(async () => {
        await finishRecording();
        await handleLeave();
    });

    const endMeetingWithStopRecording = useStableCallback(async () => {
        await finishRecording();
        await handleEndMeeting();
    });

    const meetingExpiredWithStopRecording = useStableCallback(async () => {
        await finishRecording();
        await handleMeetingExpired();
    });

    useMeetingTelemetry(websocketUrl ?? undefined);

    // Safari needs a warmup so we can pass strict Safari PiP requirements
    // Running after joining the meeting
    useEffect(() => {
        if (isSafari()) {
            void pictureInPictureWarmup();

            return () => {
                void pipCleanup();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const meetContextValue = useMemo(
        () => ({
            handleLeave: leaveWithStopRecording,
            handleEndMeeting: endMeetingWithStopRecording,
            handleMeetingExpired: meetingExpiredWithStopRecording,
            startScreenShare,
            stopScreenShare,
            handleMeetingLockToggle,
            assignHost,
            getKeychainIndexInformation,
        }),
        [
            leaveWithStopRecording,
            endMeetingWithStopRecording,
            meetingExpiredWithStopRecording,
            startScreenShare,
            stopScreenShare,
            handleMeetingLockToggle,
            assignHost,
            getKeychainIndexInformation,
        ]
    );

    const debugOverlayValue = useMemo(
        () => ({ isEnabled: debugOverlay.isEnabled, open: debugOverlay.open }),
        [debugOverlay.isEnabled, debugOverlay.open]
    );

    return (
        <DebugOverlayContext.Provider value={debugOverlayValue}>
            <div className="w-full h-full flex flex-col flex-nowrap items-center justify-center">
                <MeetingAnnouncer
                    isReconnecting={isReconnecting}
                    mlsRetrying={mlsRetrying}
                    isDisconnected={isDisconnected}
                    liveKitConnectionState={liveKitConnectionState}
                    showReconnectedMessage={showReconnectedMessage}
                    isUsingTurnRelay={isUsingTurnRelay}
                >
                    <MeetContext.Provider value={meetContextValue}>
                        {debugOverlay.isOpen && (
                            <DebugOverlay
                                isOpen={debugOverlay.isOpen}
                                onClose={debugOverlay.close}
                                onSimulateReconnection={onSimulateReconnection}
                            />
                        )}
                        <MeetingBody
                            screenShareTrack={screenShareTrack}
                            screenShareParticipant={screenShareParticipant}
                            isUsingTurnRelay={isUsingTurnRelay}
                            liveKitConnectionState={liveKitConnectionState}
                            showReconnectedMessage={showReconnectedMessage}
                            setShowReconnectedMessage={setShowReconnectedMessage}
                            setLiveKitConnectionState={setLiveKitConnectionState}
                            isDisconnected={isDisconnected}
                            isReconnecting={isReconnecting}
                            mlsRetrying={mlsRetrying}
                        />
                    </MeetContext.Provider>
                    <AutoCloseMeetingModal participantCount={totalParticipantCount} onLeave={handleLeave} />
                </MeetingAnnouncer>
            </div>
        </DebugOverlayContext.Provider>
    );
};

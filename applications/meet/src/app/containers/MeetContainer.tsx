import { createContext, useContext, useEffect, useLayoutEffect, useMemo } from 'react';

import type { ConnectionState } from 'livekit-client';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { resetMeetingInfo, setMeetingInfo } from '@proton/meet/store/slices/meetingInfo';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/sortedParticipantsSlice';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { AutoCloseMeetingModal } from '../components/AutoCloseMeetingModal/AutoCloseMeetingModal';
import { DebugOverlay, useDebugOverlay } from '../components/DebugOverlay/DebugOverlay';
import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { MeetContext } from '../contexts/MeetContext';
import { MeetingRecorderContext } from '../contexts/MeetingRecorderContext';
import { useMeetingTelemetry } from '../hooks/telemetry/useMeetingTelemetry';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder/useMeetingRecorder';
import { useStableCallback } from '../hooks/useStableCallback';

// Debug overlay context for mobile menu access
interface DebugOverlayContextType {
    isEnabled: boolean;
    open: () => void;
}

const DebugOverlayContext = createContext<DebugOverlayContextType>({
    isEnabled: false,
    open: () => {},
});

export const useDebugOverlayContext = () => useContext(DebugOverlayContext);

interface MeetContainerProps {
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    paidUser: boolean;
    displayName: string;
    handleLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    shareLink: string;
    roomName: string;
    passphrase: string;
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
}

export const MeetContainer = ({
    expirationTime,
    maxDuration,
    maxParticipants,
    paidUser,
    displayName,
    handleLeave,
    handleEndMeeting,
    shareLink,
    roomName,
    passphrase,
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
                paidUser,
                maxDuration,
                maxParticipants,
                expirationTime,
                instantMeeting,
                displayName,
                passphrase,
                isGuestAdmin,
            })
        );
    }, [
        dispatch,
        roomName,
        shareLink,
        paidUser,
        maxDuration,
        maxParticipants,
        expirationTime,
        instantMeeting,
        displayName,
        passphrase,
        isGuestAdmin,
    ]);

    useEffect(() => {
        return () => {
            dispatch(resetMeetingInfo());
        };
    }, [dispatch]);

    const totalParticipantCount = useMeetSelector(selectTotalParticipantCount);

    const { recordingState, startRecording, downloadRecording } = useMeetingRecorder();

    const leaveWithStopRecording = useStableCallback(async () => {
        await downloadRecording();
        await handleLeave();
    });

    const endMeetingWithStopRecording = useStableCallback(async () => {
        await downloadRecording();
        await handleEndMeeting();
    });

    useMeetingTelemetry();

    // Safari needs a warmup so we can pass strict Safari PiP requirements
    // Running after joining the meeting
    useEffect(() => {
        if (isSafari()) {
            void pictureInPictureWarmup();

            return () => {
                void pipCleanup();
            };
        }
    }, []);

    const meetContextValue = useMemo(
        () => ({
            handleLeave: leaveWithStopRecording,
            handleEndMeeting: endMeetingWithStopRecording,
            startScreenShare,
            stopScreenShare,
            handleMeetingLockToggle,
            assignHost,
            getKeychainIndexInformation,
        }),
        [
            leaveWithStopRecording,
            endMeetingWithStopRecording,
            startScreenShare,
            stopScreenShare,
            handleMeetingLockToggle,
            assignHost,
            getKeychainIndexInformation,
        ]
    );

    const meetingRecorderContextValue = useMemo(
        () => ({
            recordingState,
            startRecording,
            downloadRecording,
        }),
        [recordingState, startRecording, downloadRecording]
    );

    return (
        <DebugOverlayContext.Provider value={{ isEnabled: debugOverlay.isEnabled, open: debugOverlay.open }}>
            <div className="w-full h-full flex flex-col flex-nowrap items-center justify-center">
                <MeetingRecorderContext.Provider value={meetingRecorderContextValue}>
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
                </MeetingRecorderContext.Provider>
            </div>
        </DebugOverlayContext.Provider>
    );
};

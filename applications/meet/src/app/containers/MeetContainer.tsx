import { createContext, useContext, useEffect, useState } from 'react';

import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { AutoCloseMeetingModal } from '../components/AutoCloseMeetingModal/AutoCloseMeetingModal';
import { DebugOverlay, useDebugOverlay } from '../components/DebugOverlay/DebugOverlay';
import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { MeetContext } from '../contexts/MeetContext';
import { MeetingRecorderContext } from '../contexts/MeetingRecorderContext';
import { useMeetingTelemetry } from '../hooks/telemetry/useMeetingTelemetry';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder/useMeetingRecorder';
import { useParticipantEvents } from '../hooks/useParticipantEvents';
import type { KeyRotationLog, MLSGroupState, MeetChatMessage, ParticipantEntity } from '../types';

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
    mlsGroupState: MLSGroupState | null;
    displayName: string;
    handleLeave: () => void;
    handleUngracefulLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    shareLink: string;
    roomName: string;
    participantsMap: Record<string, ParticipantEntity>;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
    passphrase: string;
    guestMode: boolean;
    handleMeetingLockToggle: () => Promise<void>;
    isDisconnected: boolean;
    startPiP: () => void;
    stopPiP: () => void;
    chatMessages: MeetChatMessage[];
    setChatMessages: React.Dispatch<React.SetStateAction<MeetChatMessage[]>>;
    pictureInPictureWarmup: () => void;
    pipCleanup: () => void;
    preparePictureInPicture: () => void;
    instantMeeting: boolean;
    assignHost: (participantUuid: string) => Promise<void>;
    keyRotationLogs: KeyRotationLog[];
    isRecordingInProgress: boolean;
    getKeychainIndexInformation: () => (number | undefined)[];
    sortedParticipants: (RemoteParticipant | LocalParticipant)[];
    pagedParticipants: (RemoteParticipant | LocalParticipant)[];
    sortedParticipantsMap: Map<string, RemoteParticipant | LocalParticipant>;
    pageCount: number;
    pagedParticipantsWithoutSelfView: (RemoteParticipant | LocalParticipant)[];
    pageCountWithoutSelfView: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setPageSize: React.Dispatch<React.SetStateAction<number>>;
    page: number;
    pageSize: number;
    expirationTime: number | null;
    isGuestAdmin: boolean;
    participants: (RemoteParticipant | LocalParticipant)[];
    isUsingTurnRelay: boolean;
}

export const MeetContainer = ({
    participants,
    sortedParticipants,
    sortedParticipantsMap,
    pagedParticipants,
    pageCount,
    pagedParticipantsWithoutSelfView,
    pageCountWithoutSelfView,
    setPage,
    setPageSize,
    page,
    pageSize,
    expirationTime,
    locked,
    maxDuration,
    maxParticipants,
    paidUser,
    mlsGroupState,
    displayName,
    handleLeave,
    handleUngracefulLeave,
    handleEndMeeting,
    shareLink,
    roomName,
    participantsMap,
    participantNameMap,
    getParticipants,
    passphrase,
    guestMode,
    handleMeetingLockToggle,
    isDisconnected,
    startPiP,
    stopPiP,
    chatMessages,
    setChatMessages,
    pictureInPictureWarmup,
    pipCleanup,
    preparePictureInPicture,
    instantMeeting,
    assignHost,
    keyRotationLogs,
    isGuestAdmin,
    isRecordingInProgress,
    getKeychainIndexInformation,
    isUsingTurnRelay,
}: MeetContainerProps) => {
    const [resolution, setResolution] = useState<string | null>(null);
    const debugOverlay = useDebugOverlay();

    const participantEvents = useParticipantEvents(participantNameMap);

    const { recordingState, startRecording, stopRecording, downloadRecording } = useMeetingRecorder(
        participantNameMap,
        pagedParticipants
    );

    const {
        isScreenShare,
        isLocalScreenShare,
        startScreenShare,
        stopScreenShare,
        screenShareParticipant,
        screenShareTrack,
    } = useCurrentScreenShare({ stopPiP, startPiP, preparePictureInPicture });

    const leaveWithStopRecording = async () => {
        await downloadRecording();
        await handleLeave();
    };

    const endMeetingWithStopRecording = async () => {
        await downloadRecording();
        await handleEndMeeting();
    };

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

    return (
        <DebugOverlayContext.Provider value={{ isEnabled: debugOverlay.isEnabled, open: debugOverlay.open }}>
            <div className="w-full h-full flex flex-col flex-nowrap items-center justify-center">
                <MeetingRecorderContext.Provider
                    value={{ recordingState, startRecording, stopRecording, downloadRecording }}
                >
                    <MeetContext.Provider
                        value={{
                            participants,
                            sortedParticipants,
                            pagedParticipants,
                            pageCount,
                            pagedParticipantsWithoutSelfView,
                            pageCountWithoutSelfView,
                            setPage,
                            setPageSize,
                            roomName,
                            resolution,
                            setResolution,
                            meetingLink: shareLink,
                            chatMessages,
                            setChatMessages,
                            participantEvents,
                            handleLeave: leaveWithStopRecording,
                            handleUngracefulLeave: handleUngracefulLeave,
                            handleEndMeeting: endMeetingWithStopRecording,
                            participantsMap,
                            participantNameMap,
                            getParticipants,
                            displayName,
                            page,
                            pageSize,
                            passphrase,
                            guestMode,
                            mlsGroupState,
                            startScreenShare,
                            stopScreenShare,
                            isLocalScreenShare,
                            isScreenShare,
                            screenShareParticipant,
                            screenShareTrack,
                            handleMeetingLockToggle,
                            isDisconnected,
                            startPiP,
                            stopPiP,
                            preparePictureInPicture,
                            locked,
                            maxDuration,
                            maxParticipants,
                            instantMeeting,
                            assignHost,
                            paidUser,
                            keyRotationLogs,
                            expirationTime,
                            isGuestAdmin,
                            isRecordingInProgress,
                            getKeychainIndexInformation,
                            sortedParticipantsMap,
                        }}
                    >
                        {debugOverlay.isOpen && (
                            <DebugOverlay isOpen={debugOverlay.isOpen} onClose={debugOverlay.close} />
                        )}
                        <MeetingBody
                            isScreenShare={isScreenShare}
                            isLocalScreenShare={isLocalScreenShare}
                            screenShareTrack={screenShareTrack}
                            screenShareParticipant={screenShareParticipant}
                            isUsingTurnRelay={isUsingTurnRelay}
                        />
                    </MeetContext.Provider>
                    <AutoCloseMeetingModal participantCount={participants.length} onLeave={handleLeave} />
                </MeetingRecorderContext.Provider>
            </div>
        </DebugOverlayContext.Provider>
    );
};

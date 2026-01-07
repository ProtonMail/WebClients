import { useEffect, useState } from 'react';

import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { AutoCloseMeetingModal } from '../components/AutoCloseMeetingModal/AutoCloseMeetingModal';
import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { MeetContext } from '../contexts/MeetContext';
import { MeetingRecorderContext } from '../contexts/MeetingRecorderContext';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder/useMeetingRecorder';
import { useParticipantEvents } from '../hooks/useParticipantEvents';
import type { DecryptionErrorLog, KeyRotationLog, MLSGroupState, MeetChatMessage, ParticipantEntity } from '../types';

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
    pipSetup: (throttle: boolean) => void;
    pipCleanup: () => void;
    preparePictureInPicture: () => void;
    instantMeeting: boolean;
    assignHost: (participantUuid: string) => Promise<void>;
    keyRotationLogs: KeyRotationLog[];
    isRecordingInProgress: boolean;
    getKeychainIndexInformation: () => (number | undefined)[];
    decryptionErrorLogs: DecryptionErrorLog[];
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
}

export const MeetContainer = ({
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
    pipSetup,
    pipCleanup,
    preparePictureInPicture,
    instantMeeting,
    assignHost,
    keyRotationLogs,
    isGuestAdmin,
    isRecordingInProgress,
    getKeychainIndexInformation,
    decryptionErrorLogs,
}: MeetContainerProps) => {
    const [resolution, setResolution] = useState<string | null>(null);

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

    useEffect(() => {
        if (isSafari()) {
            void pipSetup(true);

            return pipCleanup;
        }
    }, []);

    return (
        <div className="w-full h-full flex flex-col flex-nowrap items-center justify-center">
            <MeetingRecorderContext.Provider
                value={{ recordingState, startRecording, stopRecording, downloadRecording }}
            >
                <MeetContext.Provider
                    value={{
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
                        decryptionErrorLogs,
                        sortedParticipantsMap,
                    }}
                >
                    <MeetingBody
                        isScreenShare={isScreenShare}
                        isLocalScreenShare={isLocalScreenShare}
                        screenShareTrack={screenShareTrack}
                        screenShareParticipant={screenShareParticipant}
                    />
                </MeetContext.Provider>
                <AutoCloseMeetingModal onLeave={() => handleLeave()} />
            </MeetingRecorderContext.Provider>
        </div>
    );
};

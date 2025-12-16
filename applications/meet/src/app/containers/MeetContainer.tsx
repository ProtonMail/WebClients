import { useEffect, useState } from 'react';

import { VideoQuality } from 'livekit-client';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { AutoCloseMeetingModal } from '../components/AutoCloseMeetingModal/AutoCloseMeetingModal';
import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../constants';
import { MeetContext } from '../contexts/MeetContext';
import { MeetingRecorderContext } from '../contexts/MeetingRecorderContext';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../hooks/useIsNarrowHeight';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder/useMeetingRecorder';
import { useParticipantEvents } from '../hooks/useParticipantEvents';
import { useSortedParticipants } from '../hooks/useSortedParticipants';
import type { DecryptionErrorLog, KeyRotationLog, MLSGroupState, MeetChatMessage, ParticipantEntity } from '../types';

interface MeetContainerProps {
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    paidUser: boolean;
    mlsGroupState: MLSGroupState | null;
    displayName: string;
    handleLeave: () => void;
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
}

export const MeetContainer = ({
    locked,
    maxDuration,
    maxParticipants,
    paidUser,
    mlsGroupState,
    displayName,
    handleLeave,
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
    isRecordingInProgress,
    getKeychainIndexInformation,
    decryptionErrorLogs,
}: MeetContainerProps) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);

    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();

    const [pageSize, setPageSize] = useState(isLargerThanMd && !isNarrowHeight ? PAGE_SIZE : SMALL_SCREEN_PAGE_SIZE);
    const [resolution, setResolution] = useState<string | null>(null);

    const participantEvents = useParticipantEvents(participantNameMap);

    const [participantsWithDisabledVideos, setParticipantsWithDisabledVideos] = useState<string[]>([]);

    const {
        sortedParticipants,
        pagedParticipants,
        pageCount,
        pagedParticipantsWithoutSelfView,
        pageCountWithoutSelfView,
    } = useSortedParticipants({
        page,
        pageSize,
    });

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
                        page,
                        quality,
                        setPage,
                        setQuality,
                        roomName,
                        resolution,
                        setResolution,
                        meetingLink: shareLink,
                        chatMessages,
                        setChatMessages,
                        participantEvents,
                        pageSize,
                        setPageSize,
                        handleLeave: leaveWithStopRecording,
                        handleEndMeeting: endMeetingWithStopRecording,
                        participantsMap,
                        participantNameMap,
                        getParticipants,
                        participantsWithDisabledVideos,
                        setParticipantsWithDisabledVideos,
                        displayName,
                        sortedParticipants,
                        pagedParticipants,
                        pageCount,
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
                        pagedParticipantsWithoutSelfView,
                        pageCountWithoutSelfView,
                        assignHost,
                        paidUser,
                        keyRotationLogs,
                        isRecordingInProgress,
                        getKeychainIndexInformation,
                        decryptionErrorLogs,
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

import { useCallback, useState } from 'react';

import { VideoQuality } from '@proton-meet/livekit-client';

import { AutoCloseMeetingModal } from '../components/AutoCloseMeetingModal/AutoCloseMeetingModal';
import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../constants';
import { MeetContext } from '../contexts/MeetContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { useAudioToggle } from '../hooks/useAudioToggle';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../hooks/useIsNarrowHeight';
import { useParticipantEvents } from '../hooks/useParticipantEvents';
import { useSortedParticipants } from '../hooks/useSortedParticipants';
import { useVideoToggle } from '../hooks/useVideoToggle';
import type { MeetChatMessage, ParticipantEntity, ParticipantSettings } from '../types';

interface MeetContainerProps {
    setParticipantSettings: React.Dispatch<React.SetStateAction<ParticipantSettings | null>>;
    participantSettings: ParticipantSettings;
    setAudioDeviceId: (deviceId: string | null) => void;
    setAudioOutputDeviceId: (deviceId: string | null) => void;
    setVideoDeviceId: (deviceId: string | null) => void;
    handleLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    shareLink: string;
    roomName: string;
    participantsMap: Record<string, ParticipantEntity>;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
    instantMeeting: boolean;
    passphrase: string;
    guestMode: boolean;
}

export const MeetContainer = ({
    setParticipantSettings,
    participantSettings: {
        audioDeviceId,
        audioOutputDeviceId,
        videoDeviceId,
        isAudioEnabled,
        isVideoEnabled,
        displayName,
    },
    setAudioDeviceId,
    setAudioOutputDeviceId,
    setVideoDeviceId,
    handleLeave,
    handleEndMeeting,
    shareLink,
    roomName,
    participantsMap,
    participantNameMap,
    getParticipants,
    instantMeeting,
    passphrase,
    guestMode,
}: MeetContainerProps) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);

    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();

    const [pageSize, setPageSize] = useState(isLargerThanMd && !isNarrowHeight ? PAGE_SIZE : SMALL_SCREEN_PAGE_SIZE);
    const [resolution, setResolution] = useState<string | null>(null);

    const [chatMessages, setChatMessages] = useState<MeetChatMessage[]>([]);
    const participantEvents = useParticipantEvents(participantNameMap);

    const [disableVideos, setDisableVideos] = useState(false);

    const [participantsWithDisabledVideos, setParticipantsWithDisabledVideos] = useState<string[]>([]);

    const { sortedParticipants, pagedParticipants, pageCount } = useSortedParticipants({
        page,
        pageSize,
    });

    const {
        isScreenShare,
        isLocalScreenShare,
        startScreenShare,
        stopScreenShare,
        screenShareParticipant,
        screenShareTrack,
    } = useCurrentScreenShare();

    const setIsVideoEnabled = useCallback(
        (isEnabled: boolean) => {
            setParticipantSettings(
                (prevParticipantSettings) =>
                    ({ ...prevParticipantSettings, isVideoEnabled: isEnabled }) as ParticipantSettings
            );
        },
        [setParticipantSettings]
    );

    const { toggleVideo, handleRotateCamera } = useVideoToggle(setIsVideoEnabled);
    const toggleAudio = useAudioToggle();

    return (
        <div className="w-full h-full flex flex-col flex-nowrap items-center justify-center">
            <MeetContext.Provider
                value={{
                    page,
                    quality,
                    setPage,
                    setQuality,
                    audioDeviceId,
                    videoDeviceId,
                    setAudioDeviceId,
                    audioOutputDeviceId,
                    setAudioOutputDeviceId,
                    setVideoDeviceId,
                    roomName,
                    resolution,
                    setResolution,
                    meetingLink: shareLink,
                    chatMessages,
                    setChatMessages,
                    participantEvents,
                    pageSize,
                    setPageSize,
                    handleLeave,
                    handleEndMeeting,
                    isAudioEnabled,
                    isVideoEnabled,
                    setIsVideoEnabled,
                    handleRotateCamera,
                    participantsMap,
                    participantNameMap,
                    getParticipants,
                    disableVideos,
                    setDisableVideos,
                    participantsWithDisabledVideos,
                    setParticipantsWithDisabledVideos,
                    displayName,
                    sortedParticipants,
                    pagedParticipants,
                    pageCount,
                    passphrase,
                    guestMode,
                    startScreenShare,
                    stopScreenShare,
                    isLocalScreenShare,
                    isScreenShare,
                    screenShareParticipant,
                    toggleVideo,
                    toggleAudio,
                }}
            >
                <UIStateProvider instantMeeting={instantMeeting}>
                    <MeetingBody
                        isScreenShare={isScreenShare}
                        isLocalScreenShare={isLocalScreenShare}
                        stopScreenShare={stopScreenShare}
                        screenShareTrack={screenShareTrack}
                        screenShareParticipant={screenShareParticipant}
                    />
                </UIStateProvider>
            </MeetContext.Provider>
            <AutoCloseMeetingModal onLeave={() => handleLeave()} />
        </div>
    );
};

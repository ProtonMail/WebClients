import { useCallback, useState } from 'react';

import { VideoQuality } from 'livekit-client';

import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { PAGE_SIZE } from '../constants';
import { MeetContext } from '../contexts/MeetContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { useFaceTrackingSetup } from '../hooks/useFaceTrackingSetup';
import type { MeetChatMessage, ParticipantEventRecord } from '../types';
import { type ParticipantSettings } from '../types';

interface MeetContainerProps {
    setParticipantSettings: React.Dispatch<React.SetStateAction<ParticipantSettings | null>>;
    participantSettings: ParticipantSettings;
    setAudioDeviceId: (deviceId: string | null) => void;
    setAudioOutputDeviceId: (deviceId: string | null) => void;
    setVideoDeviceId: (deviceId: string | null) => void;
    handleLeave: () => void;
    shareLink: string;
    roomName: string;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
    instantMeeting: boolean;
}

export const MeetContainer = ({
    setParticipantSettings,
    participantSettings: {
        audioDeviceId,
        audioOutputDeviceId,
        videoDeviceId,
        isFaceTrackingEnabled,
        isAudioEnabled,
        isVideoEnabled,
        displayName,
    },
    setAudioDeviceId,
    setAudioOutputDeviceId,
    setVideoDeviceId,
    handleLeave,
    shareLink,
    roomName,
    participantNameMap,
    getParticipants,
    instantMeeting,
}: MeetContainerProps) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [resolution, setResolution] = useState<string | null>(null);

    const [chatMessages, setChatMessages] = useState<MeetChatMessage[]>([]);
    const [participantEvents, setParticipantEvents] = useState<ParticipantEventRecord[]>([]);

    const [selfView, setSelfView] = useState(true);
    const [shouldShowConnectionIndicator, setShouldShowConnectionIndicator] = useState(false);
    const [disableVideos, setDisableVideos] = useState(false);

    const faceTrack = useFaceTrackingSetup({ isFaceTrackingEnabled, videoDeviceId });

    const [participantsWithDisabledVideos, setParticipantsWithDisabledVideos] = useState<string[]>([]);

    const setIsVideoEnabled = useCallback(
        (isEnabled: boolean) => {
            setParticipantSettings(
                (prevParticipantSettings) =>
                    ({ ...prevParticipantSettings, isVideoEnabled: isEnabled }) as ParticipantSettings
            );
        },
        [setParticipantSettings]
    );

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
                    setParticipantEvents,
                    selfView,
                    setSelfView,
                    shouldShowConnectionIndicator,
                    setShouldShowConnectionIndicator,
                    pageSize,
                    setPageSize,
                    handleLeave,
                    isAudioEnabled,
                    isVideoEnabled,
                    isFaceTrackingEnabled,
                    setIsVideoEnabled,
                    participantNameMap,
                    getParticipants,
                    disableVideos,
                    setDisableVideos,
                    participantsWithDisabledVideos,
                    setParticipantsWithDisabledVideos,
                    displayName,
                }}
            >
                <UIStateProvider instantMeeting={instantMeeting}>
                    <MeetingBody isFaceTrackingEnabled={isFaceTrackingEnabled} faceTrack={faceTrack} />
                </UIStateProvider>
            </MeetContext.Provider>
        </div>
    );
};

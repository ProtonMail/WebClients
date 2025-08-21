import { useCallback, useState } from 'react';

import { VideoQuality } from '@proton-meet/livekit-client';

import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../constants';
import { MeetContext } from '../contexts/MeetContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { useFaceTrackingSetup } from '../hooks/useFaceTrackingSetup';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../hooks/useIsNarrowHeight';
import { useSortedParticipants } from '../hooks/useSortedParticipants';
import type { MeetChatMessage, ParticipantEntity, ParticipantEventRecord, ParticipantSettings } from '../types';

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
    handleEndMeeting,
    shareLink,
    roomName,
    participantsMap,
    participantNameMap,
    getParticipants,
    instantMeeting,
}: MeetContainerProps) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);

    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();

    const [pageSize, setPageSize] = useState(isLargerThanMd && !isNarrowHeight ? PAGE_SIZE : SMALL_SCREEN_PAGE_SIZE);
    const [resolution, setResolution] = useState<string | null>(null);

    const [chatMessages, setChatMessages] = useState<MeetChatMessage[]>([]);
    const [participantEvents, setParticipantEvents] = useState<ParticipantEventRecord[]>([]);

    const [disableVideos, setDisableVideos] = useState(false);

    const faceTrack = useFaceTrackingSetup({ isFaceTrackingEnabled, videoDeviceId });

    const [participantsWithDisabledVideos, setParticipantsWithDisabledVideos] = useState<string[]>([]);

    const { sortedParticipants, pagedParticipants, pageCount } = useSortedParticipants({
        page,
        pageSize,
    });

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
                    pageSize,
                    setPageSize,
                    handleLeave,
                    handleEndMeeting,
                    isAudioEnabled,
                    isVideoEnabled,
                    isFaceTrackingEnabled,
                    setIsVideoEnabled,
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
                }}
            >
                <UIStateProvider instantMeeting={instantMeeting}>
                    <MeetingBody isFaceTrackingEnabled={isFaceTrackingEnabled} faceTrack={faceTrack} />
                </UIStateProvider>
            </MeetContext.Provider>
        </div>
    );
};

import { useCallback, useState } from 'react';

import { VideoQuality } from 'livekit-client';

import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { PAGE_SIZE } from '../constants';
import { MeetContext } from '../contexts/MeetContext';
import { useFaceTrackingSetup } from '../hooks/useFaceTrackingSetup';
import type { MeetChatMessage, ParticipantEventRecord } from '../types';
import { MeetingSideBars, type ParticipantSettings, PopUpControls } from '../types';

interface MeetContainerProps {
    setParticipantSettings: React.Dispatch<React.SetStateAction<ParticipantSettings | null>>;
    participantSettings: ParticipantSettings;
    setAudioDeviceId: (deviceId: string) => void;
    setVideoDeviceId: (deviceId: string) => void;
    handleLeave: () => void;
    shareLink: string;
    roomName: string;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
}

export const MeetContainer = ({
    setParticipantSettings,
    participantSettings: { audioDeviceId, videoDeviceId, isFaceTrackingEnabled, isAudioEnabled, isVideoEnabled },
    setAudioDeviceId,
    setVideoDeviceId,
    handleLeave,
    shareLink,
    roomName,
    participantNameMap,
    getParticipants,
}: MeetContainerProps) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [resolution, setResolution] = useState<string | null>(null);

    const [chatMessages, setChatMessages] = useState<MeetChatMessage[]>([]);
    const [participantEvents, setParticipantEvents] = useState<ParticipantEventRecord[]>([]);

    const [sideBarState, setSideBarState] = useState({
        [MeetingSideBars.Participants]: false,
        [MeetingSideBars.Settings]: false,
        [MeetingSideBars.Chat]: false,
        [MeetingSideBars.MeetingDetails]: false,
    });

    const [popupState, setPopupState] = useState({
        [PopUpControls.Microphone]: false,
        [PopUpControls.Camera]: false,
    });

    const [selfView, setSelfView] = useState(true);
    const [shouldShowConnectionIndicator, setShouldShowConnectionIndicator] = useState(false);

    const faceTrack = useFaceTrackingSetup({ isFaceTrackingEnabled, videoDeviceId });

    const toggleSideBarState = useCallback(
        (sidebar: MeetingSideBars) => {
            setSideBarState((prev) => {
                const newSidebards = Object.fromEntries(
                    Object.entries(prev).map(([key, value]) => [key, key === sidebar ? !value : false])
                ) as Record<MeetingSideBars, boolean>;

                return newSidebards;
            });
        },
        [setSideBarState]
    );

    const togglePopupState = useCallback(
        (popup: PopUpControls) => {
            setPopupState((prev) => {
                const newPopupState = Object.fromEntries(
                    Object.entries(prev).map(([key, value]) => [key, key === popup ? !value : false])
                ) as Record<PopUpControls, boolean>;

                return newPopupState;
            });
        },
        [setPopupState]
    );

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
                    setVideoDeviceId,
                    roomName,
                    resolution,
                    setResolution,
                    meetingLink: shareLink,
                    sideBarState,
                    toggleSideBarState,
                    popupState,
                    togglePopupState,
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
                }}
            >
                <MeetingBody isFaceTrackingEnabled={isFaceTrackingEnabled} faceTrack={faceTrack} />
            </MeetContext.Provider>
        </div>
    );
};

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { LocalVideoTrack } from 'livekit-client';
import { VideoQuality } from 'livekit-client';
import { createLocalTracks } from 'livekit-client';

import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { PAGE_SIZE } from '../constants';
import { MeetContext } from '../contexts/MeetContext';
import { useAudioToggle } from '../hooks/useAudioToggle';
import { useVideoToggle } from '../hooks/useVideoToggle';
import type { MeetChatMessage, ParticipantEventRecord } from '../types';
import { MeetingSideBars, type ParticipantSettings, PopUpControls } from '../types';
import { getMeetingLink } from '../utils/getMeetingLink';

const shouldAllowExperimentalFaceCrop = process.env.EXPERIMENTAL_FACE_CROP === 'true';

export const MeetContainer = ({
    setParticipantSettings,
    participantSettings: {
        audioDeviceId,
        videoDeviceId,
        isFaceTrackingEnabled,
        roomName,
        isAudioEnabled,
        isVideoEnabled,
    },
    setAudioDeviceId,
    setVideoDeviceId,
    handleLeave,
}: {
    setParticipantSettings: React.Dispatch<React.SetStateAction<ParticipantSettings | null>>;
    participantSettings: ParticipantSettings;
    setAudioDeviceId: (deviceId: string) => void;
    setVideoDeviceId: (deviceId: string) => void;
    handleLeave: () => void;
}) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [resolution, setResolution] = useState<string | null>(null);
    const [faceTrack, setFaceTrack] = useState<LocalVideoTrack | null>(null);

    const [chatMessages, setChatMessages] = useState<MeetChatMessage[]>([]);
    const [participantEvents, setParticipantEvents] = useState<ParticipantEventRecord[]>([]);

    const meetingLink = useMemo(() => getMeetingLink(roomName), [roomName]);

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

    const toggleVideo = useVideoToggle();
    const toggleAudio = useAudioToggle();

    const toggleSideBarState = (sidebar: MeetingSideBars) => {
        setSideBarState((prev) => {
            const newSidebards = Object.fromEntries(
                Object.entries(prev).map(([key, value]) => [key, key === sidebar ? !value : false])
            ) as Record<MeetingSideBars, boolean>;

            return newSidebards;
        });
    };

    const togglePopupState = (popup: PopUpControls) => {
        setPopupState((prev) => {
            const newPopupState = Object.fromEntries(
                Object.entries(prev).map(([key, value]) => [key, key === popup ? !value : false])
            ) as Record<PopUpControls, boolean>;

            return newPopupState;
        });
    };

    const setupFaceTracking = useCallback(async () => {
        if (!isFaceTrackingEnabled || !shouldAllowExperimentalFaceCrop) {
            return;
        }

        // Dynamic import to avoid bundling the face tracking processor in the main bundle, as it is an experimental feature
        const FaceTrackingProcessor = (
            await import(
                /* webpackChunkName: "face-tracking-processor" */ '../utils/custom-processors/FaceTrackingProcessor'
            )
        ).FaceTrackingProcessor;

        const [videoTrack] = await createLocalTracks({
            video: {
                deviceId: { exact: videoDeviceId },
            },
        });

        const processor = new FaceTrackingProcessor();

        await (videoTrack as LocalVideoTrack).setProcessor(processor);

        setFaceTrack(videoTrack as LocalVideoTrack);
    }, [isFaceTrackingEnabled, videoDeviceId]);

    const setupMediaDevices = useCallback(async () => {
        void toggleVideo({ isEnabled: isVideoEnabled, videoDeviceId, isFaceTrackingEnabled });
        void toggleAudio({ isEnabled: isAudioEnabled, audioDeviceId });
    }, []);

    useEffect(() => {
        void setupMediaDevices();
    }, [setupMediaDevices]);

    useEffect(() => {
        void setupFaceTracking();
    }, [setupFaceTracking]);

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
                    meetingLink,
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
                    isVideoEnabled,
                    setIsVideoEnabled: (isEnabled) =>
                        setParticipantSettings(
                            (prevParticipantSettings) =>
                                ({ ...prevParticipantSettings, isVideoEnabled: isEnabled }) as ParticipantSettings
                        ),
                }}
            >
                <MeetingBody isFaceTrackingEnabled={isFaceTrackingEnabled} faceTrack={faceTrack} />
            </MeetContext.Provider>
        </div>
    );
};

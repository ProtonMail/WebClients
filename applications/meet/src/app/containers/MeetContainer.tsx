import { useCallback, useEffect, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { LocalVideoTrack } from 'livekit-client';
import { VideoQuality } from 'livekit-client';
import { createLocalTracks } from 'livekit-client';

import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { MeetContext } from '../contexts/MeetContext';
import type { ParticipantSettings } from '../types';

const shouldAllowExperimentalFaceCrop = process.env.EXPERIMENTAL_FACE_CROP === 'true';

export const MeetContainer = ({
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
}: {
    participantSettings: ParticipantSettings;
    setAudioDeviceId: (deviceId: string) => void;
    setVideoDeviceId: (deviceId: string) => void;
}) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [resolution, setResolution] = useState<string | null>(null);

    const [faceTrack, setFaceTrack] = useState<LocalVideoTrack | null>(null);

    const { localParticipant } = useLocalParticipant();

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
        const videoInfo = isVideoEnabled ? { deviceId: { exact: videoDeviceId as string } } : false;
        const video = isFaceTrackingEnabled ? false : videoInfo;

        const audio = isAudioEnabled ? { deviceId: { exact: audioDeviceId as string } } : false;
        await localParticipant.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined);
        await localParticipant.setCameraEnabled(!!video, typeof video !== 'boolean' ? video : undefined);
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
                    isParticipantsOpen,
                    setIsParticipantsOpen,
                    audioDeviceId,
                    videoDeviceId,
                    setAudioDeviceId,
                    setVideoDeviceId,
                    roomName,
                    isSettingsOpen,
                    setIsSettingsOpen,
                    resolution,
                    setResolution,
                }}
            >
                <MeetingBody isFaceTrackingEnabled={isFaceTrackingEnabled} faceTrack={faceTrack} />
            </MeetContext.Provider>
        </div>
    );
};

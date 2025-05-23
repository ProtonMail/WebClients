import { useCallback, useEffect, useRef, useState } from 'react';

import { LiveKitRoom } from '@livekit/components-react';
import type { LocalVideoTrack, RoomOptions } from 'livekit-client';
import { VideoQuality, createLocalTracks } from 'livekit-client';

import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { MeetContext } from '../contexts/MeetContext';
import { getE2EEOptions } from '../setupWorker';
import type { ParticipantSettings } from '../types';
import { createToken } from '../utils/createToken';

const shouldAllowExperimentalFaceCrop = process.env.EXPERIMENTAL_FACE_CROP === 'true';

const ROOM_KEY = process.env.LIVEKIT_ROOM_KEY as string;

export const MeetContainer = ({
    participantSettings: {
        displayName,
        audioDeviceId,
        videoDeviceId,
        isAudioEnabled,
        isVideoEnabled,
        isFaceTrackingEnabled,
        roomName,
    },
    setAudioDeviceId,
    setVideoDeviceId,
}: {
    participantSettings: ParticipantSettings;
    setAudioDeviceId: (deviceId: string) => void;
    setVideoDeviceId: (deviceId: string) => void;
}) => {
    const [token, setToken] = useState<string | null>(null);
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [resolution, setResolution] = useState<string | null>(null);
    const optionsRef = useRef<RoomOptions | null>(null);

    const [faceTrack, setFaceTrack] = useState<LocalVideoTrack | null>(null);

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

    const handleJoin = useCallback(async () => {
        await setupFaceTracking();

        optionsRef.current = await getE2EEOptions(ROOM_KEY);
        const token = await createToken({
            identity: crypto.randomUUID(),
            room: roomName,
            displayName,
        });
        setToken(token);
    }, [videoDeviceId, setupFaceTracking]);

    useEffect(() => {
        void handleJoin();
    }, [handleJoin]);

    if (!token) {
        return <div>Loading...</div>;
    }

    const videoInfo = isVideoEnabled ? { deviceId: { exact: videoDeviceId } } : false;

    return (
        <div className="w-full h-full flex flex-col flex-nowrap items-center justify-center">
            <LiveKitRoom
                token={token}
                serverUrl={process.env.LIVEKIT_URL}
                connect={true}
                audio={isAudioEnabled ? { deviceId: { exact: audioDeviceId } } : false}
                video={isFaceTrackingEnabled ? false : videoInfo}
                options={optionsRef.current as RoomOptions}
            >
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
            </LiveKitRoom>
        </div>
    );
};

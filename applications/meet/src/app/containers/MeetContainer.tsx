import { useCallback, useEffect, useRef, useState } from 'react';

import { LiveKitRoom } from '@livekit/components-react';
import type { LocalVideoTrack, RoomOptions } from 'livekit-client';
import { VideoQuality } from 'livekit-client';
import { createLocalTracks } from 'livekit-client';

import { MeetingBody } from '../components/MeetingBody';
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
}: {
    participantSettings: ParticipantSettings;
}) => {
    const [token, setToken] = useState<string | null>(null);
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
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
            video: { deviceId: { exact: videoDeviceId } },
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
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <LiveKitRoom
                token={token}
                serverUrl={process.env.LIVEKIT_URL}
                connect={true}
                audio={isAudioEnabled ? { deviceId: { exact: audioDeviceId } } : false}
                video={isFaceTrackingEnabled ? false : videoInfo}
                options={optionsRef.current as RoomOptions}
            >
                <MeetingBody
                    quality={quality}
                    setQuality={setQuality}
                    isFaceTrackingEnabled={isFaceTrackingEnabled}
                    faceTrack={faceTrack}
                />
            </LiveKitRoom>
        </div>
    );
};

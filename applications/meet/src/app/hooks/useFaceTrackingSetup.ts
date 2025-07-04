import { useCallback, useEffect, useState } from 'react';

import type { LocalVideoTrack } from 'livekit-client';
import { createLocalTracks } from 'livekit-client';

import { FaceTrackingProcessor } from '../utils/custom-processors/FaceTrackingProcessor';

const shouldAllowExperimentalFaceCrop = process.env.EXPERIMENTAL_FACE_CROP === 'true';

interface UseFaceTrackingSetupParams {
    isFaceTrackingEnabled: boolean;
    videoDeviceId: string | null;
}

export const useFaceTrackingSetup = ({ isFaceTrackingEnabled, videoDeviceId }: UseFaceTrackingSetupParams) => {
    const [faceTrack, setFaceTrack] = useState<LocalVideoTrack | null>(null);

    const setupFaceTracking = useCallback(async () => {
        if (!isFaceTrackingEnabled || !shouldAllowExperimentalFaceCrop) {
            return;
        }

        const [videoTrack] = await createLocalTracks({
            video: {
                deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
            },
        });

        const processor = new FaceTrackingProcessor();

        await (videoTrack as LocalVideoTrack).setProcessor(processor);

        setFaceTrack(videoTrack as LocalVideoTrack);
    }, [isFaceTrackingEnabled, videoDeviceId]);

    useEffect(() => {
        void setupFaceTracking();
    }, [setupFaceTracking]);

    return faceTrack;
};

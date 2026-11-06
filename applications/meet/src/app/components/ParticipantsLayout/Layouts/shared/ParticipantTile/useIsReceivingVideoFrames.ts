import { useEffect, useState } from 'react';

import type { RemoteTrackPublication, Track } from 'livekit-client';

import { readInboundRtp } from '../../../../../utils/e2eeRecovery/inboundRtpStats';

const SAMPLE_INTERVAL_MS = 1_000;

interface FramesSample {
    track: Track | undefined;
    isReceiving: boolean;
}

/**
 * While `isActive`, samples the remote video's decoded frame count and tells whether it still grows.
 * It reads true until two samples of the same track can be compared, so a playing video is never hidden on a guess.
 */
export const useIsReceivingVideoFrames = (publication: RemoteTrackPublication | undefined, isActive: boolean) => {
    const [sample, setSample] = useState<FramesSample>();
    const [wasActive, setWasActive] = useState(isActive);

    // Each activation starts over, so an earlier outage's stall does not hide the video on the next one.
    if (isActive !== wasActive) {
        setWasActive(isActive);
        setSample(undefined);
    }

    useEffect(() => {
        if (!isActive || !publication) {
            return;
        }

        let isSampling = true;
        let isSamplePending = false;
        let previous: { track: Track | undefined; framesDecoded: number } | undefined;

        const takeSample = async () => {
            if (isSamplePending) {
                return;
            }
            isSamplePending = true;
            const track = publication.track;
            try {
                const framesDecoded = (await readInboundRtp(publication))?.framesDecoded;
                if (!isSampling || typeof framesDecoded !== 'number') {
                    return;
                }
                if (previous && previous.track === track) {
                    setSample({ track, isReceiving: framesDecoded > previous.framesDecoded });
                }
                previous = { track, framesDecoded };
            } finally {
                isSamplePending = false;
            }
        };

        void takeSample();
        const interval = setInterval(() => {
            void takeSample();
        }, SAMPLE_INTERVAL_MS);

        return () => {
            isSampling = false;
            clearInterval(interval);
        };
    }, [publication, isActive]);

    if (!isActive || !sample || sample.track !== publication?.track) {
        return true;
    }
    return sample.isReceiving;
};

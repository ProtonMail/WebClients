import { useEffect, useRef } from 'react';

import { useScreenShareTrack } from './useScreenShareTrack';

export const useScreenShareVideo = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const screenShareTrack = useScreenShareTrack();

    useEffect(() => {
        const videoElement = videoRef.current;

        if (!screenShareTrack || !videoElement) {
            return;
        }

        screenShareTrack.attach(videoElement);

        return () => {
            screenShareTrack.detach(videoElement);
        };
    }, [screenShareTrack]);

    return videoRef;
};

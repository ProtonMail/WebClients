import { useEffect } from 'react';

import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser';

import { useLatest } from './useLatest';

interface UsePiPMediaSessionProps {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    toggleVideo: (params: { isEnabled: boolean; videoDeviceId: string }) => void;
    toggleAudio: (params: { isEnabled: boolean; audioDeviceId: string }) => void;
    videoDeviceId?: string;
    audioDeviceId?: string;
}

export function usePiPMediaSession({
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    videoDeviceId,
    audioDeviceId,
}: UsePiPMediaSessionProps) {
    const isVideoEnabledRef = useLatest(isVideoEnabled);
    const isAudioEnabledRef = useLatest(isAudioEnabled);

    // Setup MediaSession metadata and action handlers
    const setupMediaSession = () => {
        try {
            if ('mediaSession' in navigator && !isSafari() && !isFirefox()) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'Proton Meet',
                });

                navigator.mediaSession.setActionHandler('togglecamera' as MediaSessionAction, () => {
                    if (videoDeviceId) {
                        void toggleVideo({
                            isEnabled: !isVideoEnabledRef.current,
                            videoDeviceId: videoDeviceId,
                        });
                    }
                });

                navigator.mediaSession.setActionHandler('togglemicrophone' as MediaSessionAction, () => {
                    if (audioDeviceId) {
                        void toggleAudio({
                            isEnabled: !isAudioEnabledRef.current,
                            audioDeviceId: audioDeviceId,
                        });
                    }
                });
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    };

    const updateMediaSession = async () => {
        if (!('mediaSession' in navigator) || isSafari() || isFirefox()) {
            return;
        }
        const ms: MediaSession = navigator.mediaSession;

        await Promise.all([
            ms.setMicrophoneActive?.(!!isAudioEnabledRef.current),
            ms.setCameraActive?.(!!isVideoEnabledRef.current),
        ]);
    };

    useEffect(() => {
        if (!('mediaSession' in navigator) || isSafari() || isFirefox()) {
            return;
        }
        void updateMediaSession();
    }, [isAudioEnabled, isVideoEnabled]);

    return {
        setupMediaSession,
    };
}

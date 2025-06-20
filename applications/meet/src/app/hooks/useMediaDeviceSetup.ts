import { useEffect } from 'react';

import { useMeetContext } from '../contexts/MeetContext';
import { useAudioToggle } from './useAudioToggle';
import { useVideoToggle } from './useVideoToggle';

export const useMediaDeviceSetup = () => {
    const toggleVideo = useVideoToggle();
    const toggleAudio = useAudioToggle();

    const { isVideoEnabled, isAudioEnabled, videoDeviceId, audioDeviceId, isFaceTrackingEnabled } = useMeetContext();

    const setupMediaDevices = () => {
        void toggleVideo({ isEnabled: isVideoEnabled, videoDeviceId, isFaceTrackingEnabled });
        void toggleAudio({ isEnabled: isAudioEnabled, audioDeviceId });
    };

    useEffect(() => {
        setupMediaDevices();
    }, []);
};

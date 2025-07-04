import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';
import { useAudioToggle } from './useAudioToggle';
import { useVideoToggle } from './useVideoToggle';

export const useMediaDeviceSetup = () => {
    const toggleVideo = useVideoToggle();
    const toggleAudio = useAudioToggle();

    const room = useRoomContext();

    const { isVideoEnabled, isAudioEnabled, videoDeviceId, audioDeviceId, isFaceTrackingEnabled, audioOutputDeviceId } =
        useMeetContext();

    const setupMediaDevices = async () => {
        if (videoDeviceId) {
            void toggleVideo({ isEnabled: isVideoEnabled, videoDeviceId, isFaceTrackingEnabled });
        }
        void toggleAudio({ isEnabled: isAudioEnabled, audioDeviceId });

        await room.switchActiveDevice('audiooutput', audioOutputDeviceId === null ? '' : audioOutputDeviceId);
    };

    useEffect(() => {
        void setupMediaDevices();
    }, []);
};

import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';
import { supportsSetSinkId } from '../utils/browser';

export const useMediaDeviceSetup = () => {
    const room = useRoomContext();

    const {
        isVideoEnabled,
        isAudioEnabled,
        videoDeviceId,
        audioDeviceId,
        audioOutputDeviceId,
        toggleVideo,
        toggleAudio,
    } = useMeetContext();

    const setupMediaDevices = async () => {
        if (videoDeviceId) {
            void toggleVideo({ isEnabled: isVideoEnabled, videoDeviceId });
        }
        void toggleAudio({ isEnabled: isAudioEnabled, audioDeviceId });

        if (supportsSetSinkId()) {
            await room.switchActiveDevice('audiooutput', audioOutputDeviceId === null ? '' : audioOutputDeviceId);
        }
    };

    useEffect(() => {
        void setupMediaDevices();
    }, []);
};

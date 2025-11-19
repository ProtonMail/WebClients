import { useRef } from 'react';

import { useMediaManagementContext } from '../contexts/MediaManagementContext';
import { isAudioSessionAvailable, setAudioSessionType } from '../utils/ios-audio-session';

export const useRequestPermission = () => {
    const { devicePermissions } = useMediaManagementContext();

    const devicePermissionsRef = useRef(devicePermissions);

    devicePermissionsRef.current = devicePermissions;

    const requestDevicePermission = async (deviceType: 'camera' | 'microphone', deviceId?: string) => {
        const deviceState = devicePermissionsRef.current[deviceType];

        if (deviceState !== 'granted') {
            try {
                let stream: MediaStream;

                if (deviceType === 'microphone') {
                    setAudioSessionType('auto');
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: isAudioSessionAvailable() || !deviceId ? true : { deviceId },
                    });
                    setAudioSessionType('play-and-record');
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: deviceId ? { deviceId } : true,
                    });
                }

                stream.getTracks().forEach((track) => track.stop());

                return 'granted';
            } catch (err) {
                return 'denied';
            }
        }

        return 'granted';
    };

    return requestDevicePermission;
};

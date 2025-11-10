import { useRef } from 'react';

import { useMediaManagementContext } from '../contexts/MediaManagementContext';
import { restoreIOSAudioQuality, withIOSAudioSessionWorkaround } from '../utils/ios-audio-session';

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
                    stream = await withIOSAudioSessionWorkaround(async () => {
                        return navigator.mediaDevices.getUserMedia({
                            audio: deviceId ? { deviceId } : true,
                        });
                    });
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: deviceId ? { deviceId } : true,
                    });
                }

                stream.getTracks().forEach((track) => track.stop());

                if (deviceType === 'microphone') {
                    restoreIOSAudioQuality();
                }

                return 'granted';
            } catch (err) {
                if (deviceType === 'microphone') {
                    restoreIOSAudioQuality();
                }
                return 'denied';
            }
        }

        return 'granted';
    };

    return requestDevicePermission;
};

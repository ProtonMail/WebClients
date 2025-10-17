import { useRef } from 'react';

import { useMediaManagementContext } from '../contexts/MediaManagementContext';

export const useRequestPermission = () => {
    const { devicePermissions } = useMediaManagementContext();

    const devicePermissionsRef = useRef(devicePermissions);

    devicePermissionsRef.current = devicePermissions;

    const requestDevicePermission = async (deviceType: 'camera' | 'microphone', deviceId?: string) => {
        const deviceState = devicePermissionsRef.current[deviceType];

        if (deviceState !== 'granted') {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    [deviceType === 'camera' ? 'video' : 'audio']: deviceId ? { deviceId } : true,
                });
                videoStream.getTracks().forEach((track) => track.stop());

                return 'granted';
            } catch (err) {
                return 'denied';
            }
        }

        return 'granted';
    };

    return requestDevicePermission;
};

import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { useMediaManagementContext } from '../contexts/MediaManagementContext';

export const useRequestPermission = () => {
    const { devicePermissions } = useMediaManagementContext();

    const requestDevicePermission = async (deviceType: 'camera' | 'microphone') => {
        const deviceState = devicePermissions[deviceType];

        if (deviceState !== 'granted' || isFirefox()) {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    [deviceType === 'camera' ? 'video' : 'audio']: true,
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

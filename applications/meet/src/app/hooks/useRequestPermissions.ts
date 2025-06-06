import { useCallback } from 'react';

export const useRequestPermissions = () => {
    const requestPermissions = useCallback(async () => {
        // Helper to check permission state
        const checkPermission = async (name: PermissionName) => {
            if (navigator.permissions) {
                try {
                    const status = await navigator.permissions.query({ name });
                    return status.state;
                } catch {
                    return 'prompt';
                }
            }
            return 'prompt';
        };

        const cameraState = await checkPermission('camera' as PermissionName);
        if (cameraState !== 'granted') {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStream.getTracks().forEach((track) => track.stop());
        }

        const micState = await checkPermission('microphone' as PermissionName);
        if (micState !== 'granted') {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getTracks().forEach((track) => track.stop());
        }
    }, []);

    return requestPermissions;
};

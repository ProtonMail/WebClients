import type { RefObject } from 'react';
import { useEffect } from 'react';

import { useMeetContext } from '../../contexts/MeetContext';
import { useDevices } from '../../hooks/useDevices';
import { VideoSettingsDropdown } from './VideoSettingsDropdown';

interface VideoSettingsProps {
    anchorRef?: RefObject<HTMLButtonElement>;
}

export function VideoSettings({ anchorRef }: VideoSettingsProps) {
    const { cameras, defaultCamera } = useDevices();

    const { videoDeviceId, setVideoDeviceId } = useMeetContext();

    useEffect(() => {
        if (cameras.length > 0) {
            const isDeviceAvailable = videoDeviceId ? cameras.find((c) => c.deviceId === videoDeviceId) : null;

            if (!videoDeviceId || !isDeviceAvailable) {
                const deviceToSelect = defaultCamera || cameras[0];
                if (deviceToSelect) {
                    setVideoDeviceId(deviceToSelect.deviceId);
                }
            }
        }
    }, [videoDeviceId, cameras, defaultCamera, setVideoDeviceId]);

    const handleCameraChange = async (deviceId: string) => {
        if (deviceId === videoDeviceId) {
            return;
        }

        setVideoDeviceId(deviceId, true);
    };

    return (
        <VideoSettingsDropdown
            anchorRef={anchorRef}
            handleCameraChange={handleCameraChange}
            videoDeviceId={videoDeviceId}
            cameras={cameras}
        />
    );
}

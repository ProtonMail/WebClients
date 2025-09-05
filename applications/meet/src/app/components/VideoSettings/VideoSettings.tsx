import type { RefObject } from 'react';

import { useMeetContext } from '../../contexts/MeetContext';
import { useDevices } from '../../hooks/useDevices';
import { VideoSettingsDropdown } from './VideoSettingsDropdown';

interface VideoSettingsProps {
    anchorRef?: RefObject<HTMLButtonElement>;
}

export function VideoSettings({ anchorRef }: VideoSettingsProps) {
    const { cameras } = useDevices();

    const { videoDeviceId, setVideoDeviceId } = useMeetContext();

    const handleCameraChange = async (deviceId: string) => {
        if (deviceId === videoDeviceId) {
            return;
        }

        setVideoDeviceId(deviceId);
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

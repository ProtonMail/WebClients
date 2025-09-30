import type { RefObject } from 'react';

import type { PopperPosition } from '@proton/components/components/popper/interface';

import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { VideoSettingsDropdown } from './VideoSettingsDropdown';

interface VideoSettingsProps {
    anchorRef: RefObject<HTMLButtonElement>;
    onClose: () => void;
    anchorPosition?: PopperPosition;
}

export function VideoSettings({ anchorRef, onClose, anchorPosition }: VideoSettingsProps) {
    const { selectedCameraId: videoDeviceId, toggleVideo, cameras } = useMediaManagementContext();

    const handleCameraChange = async (deviceId: string) => {
        if (deviceId === videoDeviceId) {
            return;
        }

        void toggleVideo({ videoDeviceId: deviceId });
    };

    return (
        <VideoSettingsDropdown
            anchorRef={anchorRef}
            handleCameraChange={handleCameraChange}
            videoDeviceId={videoDeviceId}
            cameras={cameras}
            onClose={onClose}
            anchorPosition={anchorPosition}
        />
    );
}

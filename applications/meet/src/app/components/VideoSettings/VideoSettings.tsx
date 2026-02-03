import { type RefObject, useMemo } from 'react';

import type { PopperPosition } from '@proton/components/components/popper/interface';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useDeviceLoading } from '../../hooks/useDeviceLoading';
import { filterDevices } from '../../utils/device-utils';
import { VideoSettingsDropdown } from './VideoSettingsDropdown';

interface VideoSettingsProps {
    anchorRef: RefObject<HTMLButtonElement>;
    onClose: () => void;
    anchorPosition?: PopperPosition;
}

export function VideoSettings({ anchorRef, onClose, anchorPosition }: VideoSettingsProps) {
    const {
        selectedCameraId: videoDeviceId,
        toggleVideo,
        cameras,
        isVideoEnabled,
        cameraState,
    } = useMediaManagementContext();

    const { isLoading, withLoading } = useDeviceLoading();

    const filteredCameras = useMemo(() => filterDevices(cameras), [cameras]);

    const handleCameraChange = async (deviceId: string) => {
        await toggleVideo({ videoDeviceId: deviceId, isEnabled: isVideoEnabled });
    };

    return (
        <VideoSettingsDropdown
            anchorRef={anchorRef}
            handleCameraChange={handleCameraChange}
            videoDeviceId={videoDeviceId}
            cameraState={cameraState}
            cameras={filteredCameras}
            onClose={onClose}
            anchorPosition={anchorPosition}
            isCameraLoading={(deviceId) => isLoading('camera', deviceId)}
            withCameraLoading={(deviceId, operation) => withLoading('camera', deviceId, operation)}
        />
    );
}

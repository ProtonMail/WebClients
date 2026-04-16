import { type RefObject, useMemo } from 'react';

import type { PopperPosition } from '@proton/components/components/popper/interface';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCameraState,
    selectCameras,
    selectSelectedCameraId,
} from '@proton/meet/store/slices/deviceManagementSlice';
import { filterDevices } from '@proton/meet/utils/deviceUtils';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useDeviceLoading } from '../../hooks/useDeviceLoading';
import { VideoSettingsDropdown } from './VideoSettingsDropdown';

interface VideoSettingsProps {
    anchorRef: RefObject<HTMLButtonElement>;
    onClose: () => void;
    anchorPosition?: PopperPosition;
}

export function VideoSettings({ anchorRef, onClose, anchorPosition }: VideoSettingsProps) {
    const videoDeviceId = useMeetSelector(selectSelectedCameraId);
    const cameras = useMeetSelector(selectCameras);
    const cameraState = useMeetSelector(selectCameraState);
    const { toggleVideo, isVideoEnabled } = useMediaManagementContext();

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

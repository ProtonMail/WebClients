import { useMemo } from 'react';

import { IcMeetCamera, IcMeetCameraOff, IcMeetMicrophone, IcMeetMicrophoneOff } from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMediaPermissionsStatus } from '../../hooks/useMediaPermissionStatus';
import { DeviceSelect } from '../DeviceSelect/DeviceSelect';
import { VideoPreview } from '../VideoPreview';

import './DeviceSettings.scss';

interface DeviceSettingsProps {
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
    onCameraToggle: () => void;
    onMicrophoneToggle: () => void;
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    selectedCameraId: string;
    selectedMicrophoneId: string;
    onCameraChange: (camera: MediaDeviceInfo) => void;
    onMicrophoneChange: (microphone: MediaDeviceInfo) => void;
    displayName: string;
}

const devicesToOptions = (devices: MediaDeviceInfo[]) => {
    return devices.map((device) => ({
        value: device.deviceId,
        label: device.label,
    }));
};

export const DeviceSettings = ({
    isCameraEnabled,
    isMicrophoneEnabled,
    onCameraToggle,
    onMicrophoneToggle,
    cameras,
    microphones,
    selectedCameraId,
    selectedMicrophoneId,
    onCameraChange,
    onMicrophoneChange,
    displayName,
}: DeviceSettingsProps) => {
    const { camera, microphone } = useMediaPermissionsStatus();

    const noCameraPermission = camera !== 'granted';
    const noMicrophonePermission = microphone !== 'granted';

    const camerasOptions = useMemo(() => devicesToOptions(cameras), [cameras]);

    const microphonesOptions = useMemo(() => devicesToOptions(microphones), [microphones]);

    return (
        <div className="flex flex-nowrap flex-column w-custom gap-2" style={{ '--w-custom': '41.6875rem' }}>
            <div
                className="device-settings w-custom h-custom relative rounded-xl overflow-hidden"
                style={{ '--w-custom': '41.6875rem', '--h-custom': '23.25rem' }}
            >
                {displayName && (
                    <div
                        className="absolute left-custom bottom-custom"
                        style={{ '--left-custom': '1.5rem', '--bottom-custom': '2rem' }}
                    >
                        {displayName}
                    </div>
                )}
                <VideoPreview
                    selectedCameraId={selectedCameraId}
                    isCameraEnabled={isCameraEnabled}
                    hasCameraPermission={!noCameraPermission}
                />
                <div
                    className="flex flex-nowrap w-full justify-center gap-2 absolute bottom-custom"
                    style={{ '--bottom-custom': '1.5rem' }}
                >
                    <CircleButton
                        onClick={onMicrophoneToggle}
                        IconComponent={isMicrophoneEnabled ? IcMeetMicrophone : IcMeetMicrophoneOff}
                        iconViewPort="0 0 19 22"
                        variant={isMicrophoneEnabled ? 'default' : 'danger'}
                        indicatorContent={noMicrophonePermission ? '!' : undefined}
                        indicatorStatus={noMicrophonePermission ? 'warning' : 'default'}
                    />
                    <CircleButton
                        onClick={onCameraToggle}
                        IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                        iconViewPort="0 0 24 24"
                        variant={isCameraEnabled ? 'default' : 'danger'}
                        indicatorContent={noCameraPermission ? '!' : undefined}
                        indicatorStatus={noCameraPermission ? 'warning' : 'default'}
                    />
                </div>
            </div>
            <div className="flex flex-nowrap gap-2 mt-2">
                <DeviceSelect
                    value={selectedMicrophoneId}
                    onValue={(value) =>
                        onMicrophoneChange(microphones.find((microphone) => microphone.deviceId === value)!)
                    }
                    options={microphonesOptions}
                    icon="meet-microphone"
                    title="Audio"
                />
                <DeviceSelect
                    value={selectedCameraId}
                    onValue={(value) => onCameraChange(cameras.find((camera) => camera.deviceId === value)!)}
                    options={camerasOptions}
                    icon="meet-camera"
                    title="Video"
                />
            </div>
        </div>
    );
};

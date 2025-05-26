import { useMemo } from 'react';

import type { IconSize } from '@proton/icons';
import { IcMeetCamera, IcMeetCameraOff, IcMeetMicrophoneOff } from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMediaPermissionsStatus } from '../../hooks/useMediaPermissionStatus';
import { DeviceSelect } from '../DeviceSelect/DeviceSelect';
import { MicrophoneWithVolume } from '../MicrophoneWithVolume';
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

const placeholderOptions = [
    {
        value: 'no-permission',
        label: 'Permissions not given.',
    },
];

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
                        onClick={noMicrophonePermission ? undefined : onMicrophoneToggle}
                        IconComponent={
                            isMicrophoneEnabled
                                ? ({ size, viewBox }) => (
                                      <MicrophoneWithVolume
                                          isMicrophoneEnabled={isMicrophoneEnabled}
                                          size={size as IconSize}
                                          viewBox={viewBox as string}
                                      />
                                  )
                                : IcMeetMicrophoneOff
                        }
                        iconViewPort="0 0 19 22"
                        variant={isMicrophoneEnabled ? 'default' : 'danger'}
                        indicatorContent={noMicrophonePermission ? '!' : undefined}
                        indicatorStatus={noMicrophonePermission ? 'warning' : 'default'}
                    />

                    <CircleButton
                        onClick={noCameraPermission ? undefined : onCameraToggle}
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
                    value={noMicrophonePermission ? 'no-permission' : selectedMicrophoneId}
                    onValue={(value) =>
                        onMicrophoneChange(microphones.find((microphone) => microphone.deviceId === value)!)
                    }
                    options={noMicrophonePermission ? placeholderOptions : microphonesOptions}
                    icon="meet-microphone"
                    title="Audio"
                    disabled={noMicrophonePermission}
                />
                <DeviceSelect
                    value={noCameraPermission ? 'no-permission' : selectedCameraId}
                    onValue={(value) => onCameraChange(cameras.find((camera) => camera.deviceId === value)!)}
                    options={noCameraPermission ? placeholderOptions : camerasOptions}
                    icon="meet-camera"
                    title="Video"
                    disabled={noCameraPermission}
                />
            </div>
        </div>
    );
};

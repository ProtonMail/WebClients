import { useMemo } from 'react';

import { c } from 'ttag';

import type { IconSize } from '@proton/icons';
import { IcMeetCamera, IcMeetCameraOff, IcMeetMicrophoneOff } from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useDevicePermissionsContext } from '../../contexts/DevicePermissionsContext';
import { DeviceSelect } from '../DeviceSelect/DeviceSelect';
import { MicrophoneWithVolume } from '../MicrophoneWithVolume';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';
import { VideoPreview } from '../VideoPreview/VideoPreview';

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
        label: c('l10n_nightly Info').t`Permissions not given.`,
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
    const {
        devicePermissions: { camera, microphone },
    } = useDevicePermissionsContext();

    const noCameraPermission = camera !== 'granted';
    const noMicrophonePermission = microphone !== 'granted';

    const camerasOptions = useMemo(() => devicesToOptions(cameras), [cameras]);

    const microphonesOptions = useMemo(() => devicesToOptions(microphones), [microphones]);

    return (
        <div className="flex flex-nowrap flex-column w-custom gap-2 mr-auto" style={{ '--w-custom': '41.6875rem' }}>
            <div
                className="device-settings w-custom h-custom relative overflow-hidden"
                style={{ '--w-custom': '41.6875rem', '--h-custom': '23.25rem' }}
            >
                {displayName && (
                    <div
                        className="absolute left-custom bottom-custom z-up"
                        style={{ '--left-custom': '1.5rem', '--bottom-custom': '2rem' }}
                    >
                        {displayName}
                    </div>
                )}
                {isCameraEnabled ? (
                    <VideoPreview selectedCameraId={selectedCameraId} />
                ) : (
                    <ParticipantPlaceholder
                        participantName={displayName}
                        backgroundColor="meet-background-1"
                        profileColor="profile-background-1"
                    />
                )}

                <div
                    className="flex flex-nowrap w-full justify-center gap-2 absolute bottom-custom z-up"
                    style={{ '--bottom-custom': '1.5rem' }}
                >
                    <CircleButton
                        className="border white-border"
                        onClick={noMicrophonePermission ? undefined : onMicrophoneToggle}
                        IconComponent={
                            isMicrophoneEnabled
                                ? ({ size }) => (
                                      <MicrophoneWithVolume
                                          isMicrophoneEnabled={isMicrophoneEnabled}
                                          size={size as IconSize}
                                      />
                                  )
                                : IcMeetMicrophoneOff
                        }
                        variant={'transparent'}
                        indicatorContent={noMicrophonePermission ? '!' : undefined}
                        indicatorStatus={noMicrophonePermission ? 'danger' : 'default'}
                        noBorder={false}
                    />

                    <CircleButton
                        className="border white-border"
                        onClick={noCameraPermission ? undefined : onCameraToggle}
                        IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                        variant={'transparent'}
                        indicatorContent={noCameraPermission ? '!' : undefined}
                        indicatorStatus={noCameraPermission ? 'danger' : 'default'}
                        noBorder={false}
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
                    title={c('l10n_nightly Label').t`Audio`}
                    disabled={noMicrophonePermission}
                />
                <DeviceSelect
                    value={noCameraPermission ? 'no-permission' : selectedCameraId}
                    onValue={(value) => onCameraChange(cameras.find((camera) => camera.deviceId === value)!)}
                    options={noCameraPermission ? placeholderOptions : camerasOptions}
                    icon="meet-camera"
                    title={c('l10n_nightly Label').t`Video`}
                    disabled={noCameraPermission}
                />
            </div>
        </div>
    );
};

import { useCallback, useState } from 'react';

import { c } from 'ttag';

import type { IconSize } from '@proton/icons';
import { IcMeetCamera, IcMeetCameraOff, IcMeetMicrophoneOff } from '@proton/icons';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useDevicePermissionsContext } from '../../contexts/DevicePermissionsContext';
import { AudioSettingsDropdown } from '../AudioSettings/AudioSettingsDropdown';
import { DeviceSelect } from '../DeviceSelect/DeviceSelect';
import { MicrophoneWithVolume } from '../MicrophoneWithVolume';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';
import { VideoPreview } from '../VideoPreview/VideoPreview';
import { VideoSettingsDropdown } from '../VideoSettings/VideoSettingsDropdown';

import './DeviceSettings.scss';

interface DeviceSettingsProps {
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
    onCameraToggle: () => void;
    onMicrophoneToggle: () => void;
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
    selectedCameraId: string;
    selectedMicrophoneId: string;
    selectedAudioOutputDeviceId: string;
    onCameraChange: (camera: MediaDeviceInfo) => void;
    onMicrophoneChange: (microphone: MediaDeviceInfo) => void;
    onAudioOutputDeviceChange: (speaker: MediaDeviceInfo) => void;
    displayName: string;
    colorIndex: number;
}

export const DeviceSettings = ({
    isCameraEnabled,
    isMicrophoneEnabled,
    onCameraToggle,
    onMicrophoneToggle,
    cameras,
    microphones,
    speakers,
    selectedCameraId,
    selectedMicrophoneId,
    selectedAudioOutputDeviceId,
    onCameraChange,
    onMicrophoneChange,
    onAudioOutputDeviceChange,
    displayName,
    colorIndex,
}: DeviceSettingsProps) => {
    const {
        devicePermissions: { camera, microphone },
    } = useDevicePermissionsContext();

    const noCameraPermission = camera !== 'granted';
    const noMicrophonePermission = microphone !== 'granted';

    const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
    const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false);

    const handleMicrophoneChange = useCallback(
        (deviceId: string) => {
            onMicrophoneChange(microphones.find((microphone) => microphone.deviceId === deviceId)!);
        },
        [onMicrophoneChange, microphones]
    );

    const handleOutputDeviceChange = useCallback(
        (deviceId: string) => {
            onAudioOutputDeviceChange(speakers.find((speaker) => speaker.deviceId === deviceId)!);
        },
        [onAudioOutputDeviceChange, speakers]
    );

    const handleCameraChange = useCallback(
        (deviceId: string) => {
            onCameraChange(cameras.find((camera) => camera.deviceId === deviceId)!);
        },
        [onCameraChange, cameras]
    );

    return (
        <div className="flex flex-nowrap flex-column w-custom gap-2 mr-auto" style={{ '--w-custom': '41.6875rem' }}>
            <div
                className="device-settings w-custom h-custom relative overflow-hidden"
                style={{ '--w-custom': '41.6875rem', '--h-custom': '23.25rem' }}
            >
                {displayName && (
                    <div
                        className="absolute left-custom bottom-custom z-up text-ellipsis max-w-custom"
                        style={{ '--left-custom': '1.5rem', '--bottom-custom': '1rem', '--max-w-custom': '12rem' }}
                        title={displayName}
                    >
                        {displayName}
                    </div>
                )}
                {isCameraEnabled ? (
                    <VideoPreview selectedCameraId={selectedCameraId} />
                ) : (
                    <ParticipantPlaceholder
                        participantName={displayName}
                        backgroundColor={`meet-background-${colorIndex}`}
                        profileColor={`profile-background-${colorIndex}`}
                    />
                )}

                <div
                    className="device-toggle-buttons flex flex-nowrap w-full justify-center gap-2 absolute bottom-custom"
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
                    label={
                        noMicrophonePermission
                            ? c('l10n_nightly Info').t`Permissions not given.`
                            : (microphones.find((microphone) => microphone.deviceId === selectedMicrophoneId)?.label ??
                              '')
                    }
                    icon="meet-microphone"
                    title={c('l10n_nightly Label').t`Audio`}
                    disabled={noMicrophonePermission}
                    isOpen={isAudioSettingsOpen}
                    setIsOpen={(newIsOpen) => {
                        setIsAudioSettingsOpen(newIsOpen);

                        if (newIsOpen) {
                            setIsVideoSettingsOpen(false);
                        }
                    }}
                    Content={AudioSettingsDropdown}
                    contentProps={{
                        microphones,
                        speakers,
                        handleInputDeviceChange: handleMicrophoneChange,
                        handleOutputDeviceChange: handleOutputDeviceChange,
                        audioDeviceId: selectedMicrophoneId,
                        activeOutputDeviceId: selectedAudioOutputDeviceId,
                    }}
                />
                <DeviceSelect
                    label={
                        noCameraPermission
                            ? c('l10n_nightly Info').t`Permissions not given.`
                            : (cameras.find((camera) => camera.deviceId === selectedCameraId)?.label ?? '')
                    }
                    icon="meet-camera"
                    title={c('l10n_nightly Label').t`Video`}
                    disabled={noCameraPermission}
                    isOpen={isVideoSettingsOpen}
                    setIsOpen={(newIsOpen) => {
                        setIsVideoSettingsOpen(newIsOpen);

                        if (newIsOpen) {
                            setIsAudioSettingsOpen(false);
                        }
                    }}
                    Content={VideoSettingsDropdown}
                    contentProps={{
                        handleCameraChange,
                        videoDeviceId: selectedCameraId,
                        cameras,
                    }}
                />
            </div>
        </div>
    );
};

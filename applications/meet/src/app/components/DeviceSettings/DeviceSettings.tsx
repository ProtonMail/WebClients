import { useState } from 'react';

import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import type { IconSize } from '@proton/icons';
import { IcMeetCamera, IcMeetCameraOff, IcMeetMicrophoneOff, IcMeetRotateCamera } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
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
    isLoading: boolean;
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
    isLoading,
}: DeviceSettingsProps) => {
    const {
        devicePermissions: { camera, microphone },
    } = useMediaManagementContext();

    const noCameraPermission = camera !== 'granted';
    const noMicrophonePermission = microphone !== 'granted';

    const noCameraDetected = cameras.length === 0;
    const noMicrophoneDetected = microphones.length === 0;

    const cameraHasWarning = noCameraPermission || noCameraDetected;
    const microphoneHasWarning = noMicrophonePermission || noMicrophoneDetected;

    const isLargerThanMd = useIsLargerThanMd();

    const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
    const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false);

    const handleMicrophoneChange = (deviceId: string) => {
        onMicrophoneChange(microphones.find((microphone) => microphone.deviceId === deviceId)!);
    };

    const handleOutputDeviceChange = (deviceId: string) => {
        onAudioOutputDeviceChange(speakers.find((speaker) => speaker.deviceId === deviceId)!);
    };

    const handleCameraChange = (deviceId: string) => {
        onCameraChange(cameras.find((camera) => camera.deviceId === deviceId)!);
    };

    const { handleRotateCamera } = useMediaManagementContext();

    const { activeBreakpoint } = useActiveBreakpoint();

    let microphoneLabel;
    if (noMicrophonePermission) {
        microphoneLabel = c('Info').t`Permissions not given.`;
    } else if (noMicrophoneDetected) {
        microphoneLabel = c('Info').t`No microphone detected.`;
    } else {
        const audioDevice = microphones.find((mic) => mic.deviceId === selectedMicrophoneId);
        const activeOutputDevice = speakers.find((speaker) => speaker.deviceId === selectedAudioOutputDeviceId);

        const isCustomCombination =
            audioDevice && activeOutputDevice && audioDevice.groupId !== activeOutputDevice.groupId;
        microphoneLabel = isCustomCombination ? c('Info').t`Custom combination` : (audioDevice?.label ?? '');
    }

    let cameraLabel;
    if (noCameraPermission) {
        cameraLabel = c('Info').t`Permissions not given.`;
    } else if (noCameraDetected) {
        cameraLabel = c('Info').t`No camera detected.`;
    } else {
        const selectedCamera = cameras.find((camera) => camera.deviceId === selectedCameraId);
        cameraLabel = selectedCamera?.label ?? '';
    }

    return (
        <div
            className={clsx(
                'device-settings-container flex flex-nowrap flex-column gap-2 mr-auto flex-1 lg:flex-none',
                isLoading && 'device-settings-container-loading'
            )}
        >
            <div className="device-settings relative overflow-hidden">
                {displayName && (
                    <div
                        className="absolute left-custom bottom-custom z-up text-ellipsis max-w-custom hidden md:block"
                        style={{ '--left-custom': '1.5rem', '--bottom-custom': '1rem', '--max-w-custom': '12rem' }}
                        title={displayName}
                    >
                        {displayName}
                    </div>
                )}
                {activeBreakpoint === 'xsmall' && (
                    <div
                        className="absolute right-custom top-custom z-up text-ellipsis"
                        style={{ '--right-custom': '0.5rem', '--top-custom': '1.25rem' }}
                    >
                        <button
                            className="flex items-center justify-center w-custom h-custom bg-weak rounded-full opacity-80"
                            style={{
                                '--w-custom': '2.25rem',
                                '--h-custom': '2.25rem',
                            }}
                            onClick={() => {
                                handleRotateCamera();
                            }}
                        >
                            <IcMeetRotateCamera />
                        </button>
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
                    className="device-toggle-buttons flex flex-nowrap w-full justify-center gap-2 absolute bottom-custom z-up"
                    style={{ '--bottom-custom': isLargerThanMd ? '1.5rem' : '0.75rem' }}
                >
                    <CircleButton
                        className="border white-border"
                        onClick={microphoneHasWarning ? undefined : onMicrophoneToggle}
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
                        indicatorContent={microphoneHasWarning ? '!' : undefined}
                        indicatorStatus={microphoneHasWarning ? 'danger' : 'default'}
                        noBorder={false}
                    />

                    <CircleButton
                        className="border white-border"
                        onClick={cameraHasWarning ? undefined : onCameraToggle}
                        IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                        variant={'transparent'}
                        indicatorContent={cameraHasWarning ? '!' : undefined}
                        indicatorStatus={cameraHasWarning ? 'danger' : 'default'}
                        noBorder={false}
                    />
                </div>
            </div>
            <div className="device-selectors hidden sm:flex flex-nowrap gap-2 mt-2">
                <DeviceSelect
                    label={microphoneLabel}
                    icon="meet-microphone"
                    title={c('Label').t`Audio`}
                    disabled={microphoneHasWarning}
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
                    label={cameraLabel}
                    icon="meet-camera"
                    title={c('Label').t`Video`}
                    disabled={cameraHasWarning}
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

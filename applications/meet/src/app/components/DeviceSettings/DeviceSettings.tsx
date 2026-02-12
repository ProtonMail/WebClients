import { useMemo, useState } from 'react';

import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { IcMeetRotateCamera } from '@proton/icons/icons/IcMeetRotateCamera';
import type { IconSize } from '@proton/icons/types';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useDeviceLoading } from '../../hooks/useDeviceLoading';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { supportsSetSinkId } from '../../utils/browser';
import { filterDevices, isDefaultDevice, resolveDevice } from '../../utils/device-utils';
import { AudioSettingsDropdown } from '../AudioSettings/AudioSettingsDropdown';
import { DeviceSelect } from '../DeviceSelect/DeviceSelect';
import { MicrophoneWithVolumeWithMicrophoneStateDirect } from '../MicrophoneWithVolume';
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
    onCameraChange: (camera: MediaDeviceInfo, isDefaultDevice: boolean) => Promise<void>;
    onMicrophoneChange: (microphone: MediaDeviceInfo, isDefaultDevice: boolean) => Promise<void>;
    onAudioOutputDeviceChange: (speaker: MediaDeviceInfo, isDefaultDevice: boolean) => Promise<void>;
    displayName: string;
    colorIndex: number;
    isLoading: boolean;
}

const circleButtonStyle = { '--circle-button-size': '3rem' };

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
        handleRotateCamera,
        initialCameraState,
        facingMode,
        cameraState,
        microphoneState,
        speakerState,
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
    const { isLoading: isDeviceLoading, withLoading } = useDeviceLoading();

    const filteredMicrophones = useMemo(() => filterDevices(microphones), [microphones]);
    const filteredSpeakers = useMemo(() => filterDevices(speakers), [speakers]);
    const filteredCameras = useMemo(() => filterDevices(cameras), [cameras]);

    const { viewportWidth } = useActiveBreakpoint();

    const handleMicrophoneChange = async (deviceId: string) => {
        await onMicrophoneChange(
            resolveDevice(deviceId, filteredMicrophones, microphoneState.systemDefault!),
            isDefaultDevice(deviceId)
        );
    };

    const handleOutputDeviceChange = async (deviceId: string) => {
        await onAudioOutputDeviceChange(
            resolveDevice(deviceId, filteredSpeakers, speakerState.systemDefault!),
            isDefaultDevice(deviceId)
        );
    };

    const handleCameraChange = async (deviceId: string) => {
        await onCameraChange(
            resolveDevice(deviceId, filteredCameras, cameraState.systemDefault!),
            isDefaultDevice(deviceId)
        );
    };

    let microphoneLabel;
    if (noMicrophonePermission) {
        microphoneLabel = c('Info').t`Permissions not given.`;
    } else if (noMicrophoneDetected) {
        microphoneLabel = c('Info').t`No microphone detected.`;
    } else {
        const audioDevice = microphones.find((mic) => mic.deviceId === selectedMicrophoneId);
        const activeOutputDevice = speakers.find((speaker) => speaker.deviceId === selectedAudioOutputDeviceId);

        if (
            audioDevice &&
            activeOutputDevice &&
            audioDevice.groupId !== activeOutputDevice.groupId &&
            supportsSetSinkId()
        ) {
            microphoneLabel = c('Info').t`Custom combination`;
        } else if (microphoneState.useSystemDefault || !microphoneState.preferredAvailable) {
            microphoneLabel = microphoneState.systemDefaultLabel;
        } else {
            microphoneLabel = audioDevice?.label ?? microphoneState.systemDefaultLabel;
        }
    }

    let cameraLabel;
    if (noCameraPermission) {
        cameraLabel = c('Info').t`Permissions not given.`;
    } else if (noCameraDetected) {
        cameraLabel = c('Info').t`No camera detected.`;
    } else {
        const selectedCamera = cameras.find((camera) => camera.deviceId === selectedCameraId);
        cameraLabel =
            cameraState.useSystemDefault || !cameraState.preferredAvailable
                ? cameraState.systemDefaultLabel
                : (selectedCamera?.label ?? cameraState.systemDefaultLabel);
    }

    const getInitalsCircleSize = () => {
        if (viewportWidth.xsmall) {
            return 'small';
        }
        if (viewportWidth['<=small']) {
            return 'medium';
        }
        if (viewportWidth.medium) {
            return 'midLarge';
        }
        if (viewportWidth['>=large']) {
            return 'large';
        }
    };

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
                        style={{ '--left-custom': '1.5rem', '--bottom-custom': '2rem', '--max-w-custom': '12rem' }}
                        title={displayName}
                    >
                        {displayName}
                    </div>
                )}
                {isMobile() && initialCameraState && (
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
                    <VideoPreview selectedCameraId={selectedCameraId} facingMode={facingMode} />
                ) : (
                    <ParticipantPlaceholder
                        participantName={displayName}
                        backgroundColor={`meet-background-${colorIndex}`}
                        profileColor={`profile-background-${colorIndex}`}
                        viewSize={getInitalsCircleSize()}
                    />
                )}

                <div
                    className="flex flex-nowrap w-full justify-center gap-2 absolute bottom-custom z-custom"
                    style={{ '--bottom-custom': isLargerThanMd ? '2rem' : '1.5rem', '--z-custom': '2' }}
                >
                    <CircleButton
                        className="border white-border"
                        onClick={microphoneHasWarning ? undefined : onMicrophoneToggle}
                        IconComponent={
                            isMicrophoneEnabled
                                ? ({ size }) => (
                                      <MicrophoneWithVolumeWithMicrophoneStateDirect size={size as IconSize} />
                                  )
                                : IcMeetMicrophoneOff
                        }
                        variant={'transparent'}
                        indicatorContent={microphoneHasWarning ? '!' : undefined}
                        indicatorStatus={microphoneHasWarning ? 'danger' : 'default'}
                        noBorder={false}
                        buttonStyle={circleButtonStyle}
                    />

                    <CircleButton
                        className="border white-border"
                        onClick={cameraHasWarning ? undefined : onCameraToggle}
                        IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                        variant={'transparent'}
                        indicatorContent={cameraHasWarning ? '!' : undefined}
                        indicatorStatus={cameraHasWarning ? 'danger' : 'default'}
                        noBorder={false}
                        buttonStyle={circleButtonStyle}
                    />
                </div>
            </div>
            {!isMobile() && (
                <div className="device-selectors flex flex-nowrap gap-2 mt-2">
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
                            microphones: filteredMicrophones,
                            speakers: filteredSpeakers,
                            handleInputDeviceChange: handleMicrophoneChange,
                            handleOutputDeviceChange: handleOutputDeviceChange,
                            audioDeviceId: selectedMicrophoneId,
                            activeOutputDeviceId: selectedAudioOutputDeviceId,
                            microphoneState,
                            speakerState,
                            isMicrophoneLoading: (deviceId: string) => isDeviceLoading('microphone', deviceId),
                            isSpeakerLoading: (deviceId: string) => isDeviceLoading('speaker', deviceId),
                            withMicrophoneLoading: (deviceId: string, operation: () => Promise<void>) =>
                                withLoading('microphone', deviceId, operation),
                            withSpeakerLoading: (deviceId: string, operation: () => Promise<void>) =>
                                withLoading('speaker', deviceId, operation),
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
                            cameraState,
                            cameras: filteredCameras,
                            isCameraLoading: (deviceId: string) => isDeviceLoading('camera', deviceId),
                            withCameraLoading: (deviceId: string, operation: () => Promise<void>) =>
                                withLoading('camera', deviceId, operation),
                        }}
                    />
                </div>
            )}
        </div>
    );
};

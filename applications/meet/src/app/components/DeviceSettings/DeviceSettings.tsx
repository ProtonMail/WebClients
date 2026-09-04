import { useEffect, useState } from 'react';

import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcImage } from '@proton/icons/icons/IcImage';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { IcMeetRotateCamera } from '@proton/icons/icons/IcMeetRotateCamera';
import { DEFAULT_DEVICE_ID } from '@proton/meet/constants';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';
import {
    selectCameraPermission,
    selectCameras,
    selectInitialCameraState,
    selectMicrophonePermission,
    selectMicrophoneState,
    selectMicrophones,
    selectSortedFilteredCameras,
    selectSortedFilteredMicrophones,
    selectSortedFilteredSpeakers,
    selectSpeakerState,
    selectSpeakers,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import { isDefaultDevice, resolveDevice } from '@proton/meet/utils/deviceUtils';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useIsBackgroundEffectsSupported } from '../../contexts/BackgroundEffects/useIsBackgroundEffectsSupported';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useDeviceLoading } from '../../hooks/useDeviceLoading';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { supportsSetSinkId } from '../../utils/browser';
import { getCameraButtonAriaLabel, getMicrophoneButtonAriaLabel } from '../../utils/mediaButtonAriaLabels';
import { cameraShortcutLabel, microphoneShortcutLabel } from '../../utils/mediaShortcuts';
import { getParticipantDisplayColorsByIndex } from '../../utils/participantDisplayColors/getParticipantDisplayColorsByIndex';
import { AudioSettingsDropdown } from '../AudioSettings/AudioSettingsDropdown';
import { DeviceSelect } from '../DeviceSelect/DeviceSelect';
import { MicrophoneWithVolumeWithMicrophoneStateDirect } from '../MicrophoneWithVolume';
import { ParticipantPlaceholder } from '../ParticipantPlaceholder/ParticipantPlaceholder';
import { PrejoinBackgrounds } from '../PrejoinBackgrounds/PrejoinBackgrounds';
import { VideoPreview } from '../VideoPreview/VideoPreview';
import { VideoSettingsDropdown } from '../VideoSettings/VideoSettingsDropdown';

import './DeviceSettings.scss';

interface DeviceSettingsProps {
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
    selectedCameraId: string;
    selectedMicrophoneId: string;
    selectedAudioOutputDeviceId: string;
    onCameraChange: (camera: SerializableDeviceInfo) => Promise<void>;
    onMicrophoneChange: (microphone: SerializableDeviceInfo, isDefaultDevice: boolean) => Promise<void>;
    onAudioOutputDeviceChange: (speaker: SerializableDeviceInfo, isDefaultDevice: boolean) => Promise<void>;
    displayName: string;
    colorIndex: number;
    isLoading: boolean;
}

const circleButtonStyle = { '--circle-button-size': '3rem' };

export const DeviceSettings = ({
    isCameraEnabled,
    isMicrophoneEnabled,
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
    const camera = useMeetSelector(selectCameraPermission);
    const microphone = useMeetSelector(selectMicrophonePermission);
    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);
    const cameras = useMeetSelector(selectCameras);
    const microphones = useMeetSelector(selectMicrophones);
    const speakers = useMeetSelector(selectSpeakers);
    const { handleRotateCamera, facingMode, handleMicrophoneToggle, handleCameraToggle } = useMediaManagementContext();
    const isBackgroundBlurSupported = useIsBackgroundEffectsSupported();

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');

    const noCameraPermission = camera !== 'granted';
    const noMicrophonePermission = microphone !== 'granted';

    const noCameraDetected = cameras.length === 0;
    const noMicrophoneDetected = microphones.length === 0;

    const cameraHasWarning = noCameraPermission || noCameraDetected;
    const microphoneHasWarning = noMicrophonePermission || noMicrophoneDetected;

    const microphoneButtonAriaLabel = getMicrophoneButtonAriaLabel({
        hasPermission: !noMicrophonePermission,
        noDeviceDetected: noMicrophoneDetected,
        isEnabled: isMicrophoneEnabled,
    });

    const cameraButtonAriaLabel = getCameraButtonAriaLabel({
        hasPermission: !noCameraPermission,
        noDeviceDetected: noCameraDetected,
        isEnabled: isCameraEnabled,
    });

    const microphoneTooltipTitle = isMobile() ? undefined : `${microphoneButtonAriaLabel} (${microphoneShortcutLabel})`;
    const cameraTooltipTitle = isMobile() ? undefined : `${cameraButtonAriaLabel} (${cameraShortcutLabel})`;

    const isLargerThanMd = useIsLargerThanMd();

    const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
    const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false);
    const [isBackgroundsOpen, setIsBackgroundsOpen] = useState(false);
    const { isLoading: isDeviceLoading, withLoading } = useDeviceLoading();

    const joiningInProgress = useMeetSelector(selectJoiningInProgress);

    // Keeps a dropdown from hovering over the joining screen, and unmounts the device tests with it.
    useEffect(() => {
        if (joiningInProgress) {
            setIsAudioSettingsOpen(false);
            setIsVideoSettingsOpen(false);
        }
    }, [joiningInProgress]);

    const filteredMicrophones = useMeetSelector(selectSortedFilteredMicrophones);
    const filteredSpeakers = useMeetSelector(selectSortedFilteredSpeakers);
    const filteredCameras = useMeetSelector(selectSortedFilteredCameras);

    const { viewportWidth } = useActiveBreakpoint();

    const handleMicrophoneChange = async (deviceId: string) => {
        await onMicrophoneChange(
            resolveDevice(deviceId, filteredMicrophones, microphoneState.systemDefault!),
            isDefaultDevice(deviceId)
        );
    };

    const handleOutputDeviceChange = async (deviceId: string) => {
        const systemDefaultFallback: SerializableDeviceInfo = {
            deviceId: DEFAULT_DEVICE_ID,
            groupId: DEFAULT_DEVICE_ID,
            kind: 'audiooutput',
            label: '',
        };
        await onAudioOutputDeviceChange(
            resolveDevice(deviceId, filteredSpeakers, speakerState.systemDefault ?? systemDefaultFallback),
            isDefaultDevice(deviceId)
        );
    };

    const handleCameraChange = async (deviceId: string) => {
        const camera = filteredCameras.find((c) => c.deviceId === deviceId);
        if (camera) {
            await onCameraChange(camera);
        }
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
        cameraLabel = selectedCamera?.label ?? c('Info').t`Loading…`;
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

    const { backgroundColor, profileColor } = getParticipantDisplayColorsByIndex(colorIndex);

    const canSelectBackgrounds = isVirtualBackgroundEnabled;
    const backgroundsButtonLabel = c('Alt').t`Backgrounds`;

    const handleBackgroundsToggle = () => {
        setIsBackgroundsOpen(!isBackgroundsOpen);
        setIsAudioSettingsOpen(false);
        setIsVideoSettingsOpen(false);
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
                        style={{ '--left-custom': '1.5rem', '--bottom-custom': '1.5rem', '--max-w-custom': '12rem' }}
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
                            aria-label={c('Alt').t`Rotate camera`}
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
                        backgroundColor={backgroundColor}
                        profileColor={profileColor}
                        viewSize={getInitalsCircleSize()}
                    />
                )}

                <div
                    className="flex flex-nowrap w-full justify-center gap-2 absolute bottom-custom z-custom"
                    style={{ '--bottom-custom': isLargerThanMd ? '2rem' : '1.5rem', '--z-custom': '2' }}
                >
                    <CircleButton
                        className="border white-border"
                        onClick={handleMicrophoneToggle}
                        IconComponent={
                            isMicrophoneEnabled ? MicrophoneWithVolumeWithMicrophoneStateDirect : IcMeetMicrophoneOff
                        }
                        variant={'transparent'}
                        indicatorContent={microphoneHasWarning ? '!' : undefined}
                        indicatorStatus={microphoneHasWarning ? 'danger' : 'default'}
                        noBorder={false}
                        buttonStyle={circleButtonStyle}
                        ariaLabel={microphoneButtonAriaLabel}
                        ariaPressed={microphoneHasWarning ? undefined : isMicrophoneEnabled}
                        tooltipTitle={microphoneTooltipTitle}
                        tooltipClassName="meet-tooltip--nowrap"
                        tooltipPlacement="top"
                    />

                    <CircleButton
                        className="border white-border"
                        onClick={handleCameraToggle}
                        IconComponent={isCameraEnabled ? IcMeetCamera : IcMeetCameraOff}
                        variant={'transparent'}
                        indicatorContent={cameraHasWarning ? '!' : undefined}
                        indicatorStatus={cameraHasWarning ? 'danger' : 'default'}
                        noBorder={false}
                        buttonStyle={circleButtonStyle}
                        ariaLabel={cameraButtonAriaLabel}
                        ariaPressed={cameraHasWarning ? undefined : isCameraEnabled}
                        tooltipTitle={cameraTooltipTitle}
                        tooltipClassName="meet-tooltip--nowrap"
                        tooltipPlacement="top"
                    />
                </div>

                {canSelectBackgrounds && (
                    <div
                        className="absolute right-custom bottom-custom z-custom"
                        style={{
                            '--right-custom': '1.5rem',
                            '--bottom-custom': isLargerThanMd ? '2rem' : '1.5rem',
                            '--z-custom': '2',
                        }}
                    >
                        <CircleButton
                            className="border white-border"
                            onClick={handleBackgroundsToggle}
                            IconComponent={IcImage}
                            variant={'transparent'}
                            noBorder={false}
                            buttonStyle={circleButtonStyle}
                            ariaLabel={backgroundsButtonLabel}
                            ariaPressed={isBackgroundsOpen}
                            ariaExpanded={isBackgroundsOpen}
                            disabled={!isBackgroundBlurSupported}
                            tooltipTitle={
                                isBackgroundBlurSupported
                                    ? backgroundsButtonLabel
                                    : c('Tooltip').t`Background effects are not supported on your browser`
                            }
                            tooltipClassName={isBackgroundBlurSupported ? 'meet-tooltip--nowrap' : undefined}
                            tooltipPlacement="top"
                        />
                    </div>
                )}
            </div>
            <div className="relative">
                {isBackgroundsOpen && (
                    // On desktop the picker overlays the device selectors, which keeps the layout height stable.
                    // On mobile there are no selectors underneath, so it has to take part in the normal flow.
                    <div className={clsx(!isMobile() && 'absolute top-0 left-0 w-full')}>
                        <PrejoinBackgrounds onClose={() => setIsBackgroundsOpen(false)} />
                    </div>
                )}
                {!isMobile() && (
                    <div
                        className="device-selectors flex flex-nowrap gap-2 mt-2"
                        {...(isBackgroundsOpen ? { inert: '' } : {})}
                    >
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
                                    setIsBackgroundsOpen(false);
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
                                showDeviceTests: true,
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
                                    setIsBackgroundsOpen(false);
                                }
                            }}
                            Content={VideoSettingsDropdown}
                            contentProps={{
                                handleCameraChange,
                                videoDeviceId: selectedCameraId,
                                cameras: filteredCameras,
                                isCameraLoading: (deviceId: string) => isDeviceLoading('camera', deviceId),
                                withCameraLoading: (deviceId: string, operation: () => Promise<void>) =>
                                    withLoading('camera', deviceId, operation),
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import type { PopperPosition } from '@proton/components/components/popper/interface';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { DEFAULT_DEVICE_ID } from '../../constants';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { DeviceState } from '../../types';
import { shouldShowDeviceCheckmark, shouldShowSystemDefaultCheckmark } from '../../utils/device-utils';
import { DeviceSettingsDropdown } from '../DeviceSettingsDropdown';
import { NoiseCancellingToggle } from '../NoiseCancellingToggle';

interface AudioSettingsDropdownProps {
    anchorRef: RefObject<HTMLButtonElement>;
    handleInputDeviceChange: (deviceId: string) => Promise<void>;
    handleOutputDeviceChange: (deviceId: string) => Promise<void>;
    audioDeviceId: string | null;
    activeOutputDeviceId: string | null;
    microphoneState: DeviceState;
    speakerState: DeviceState;
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
    onClose: () => void;
    anchorPosition?: PopperPosition;
    isMicrophoneLoading: (deviceId: string) => boolean;
    isSpeakerLoading: (deviceId: string) => boolean;
    withMicrophoneLoading: (deviceId: string, operation: () => Promise<void>) => Promise<void>;
    withSpeakerLoading: (deviceId: string, operation: () => Promise<void>) => Promise<void>;
}

const AudioSettingsDropdownComponent = ({
    anchorRef,
    handleInputDeviceChange,
    handleOutputDeviceChange,
    audioDeviceId,
    activeOutputDeviceId,
    microphoneState,
    speakerState,
    microphones,
    speakers,
    onClose,
    anchorPosition,
    isMicrophoneLoading,
    isSpeakerLoading,
    withMicrophoneLoading,
    withSpeakerLoading,
}: AudioSettingsDropdownProps) => {
    const noMicrophoneDetected = microphones.length === 0;
    const noSpeakerDetected = speakers.length === 0;

    const { noiseFilter, toggleNoiseFilter } = useMediaManagementContext();

    return (
        <DeviceSettingsDropdown anchorRef={anchorRef} anchorPosition={anchorPosition} onClose={onClose}>
            <div className="flex flex-column gap-4 px-4 py-2 meet-scrollbar overflow-x-hidden overflow-y-auto">
                <div className="flex flex-column gap-2">
                    <div className="color-hint meet-font-weight text-uppercase text-sm">
                        {!noMicrophoneDetected ? c('Info').t`Select a microphone` : c('Info').t`No microphone detected`}
                    </div>
                    {microphoneState.systemDefault && (
                        <OptionButton
                            key={DEFAULT_DEVICE_ID}
                            onClick={() => {
                                const isAlreadySelected = shouldShowSystemDefaultCheckmark(microphoneState);
                                if (isAlreadySelected) {
                                    return;
                                }
                                void withMicrophoneLoading(DEFAULT_DEVICE_ID, () =>
                                    handleInputDeviceChange(DEFAULT_DEVICE_ID)
                                );
                            }}
                            showIcon={shouldShowSystemDefaultCheckmark(microphoneState)}
                            loading={isMicrophoneLoading(DEFAULT_DEVICE_ID)}
                            label={microphoneState.systemDefaultLabel}
                            Icon={IcCheckmark}
                        />
                    )}
                    {microphones.map((mic) => (
                        <OptionButton
                            key={mic.deviceId}
                            onClick={() => {
                                const isAlreadySelected = shouldShowDeviceCheckmark(
                                    mic.deviceId,
                                    audioDeviceId!,
                                    microphoneState
                                );
                                if (isAlreadySelected) {
                                    return;
                                }
                                void withMicrophoneLoading(mic.deviceId, () => handleInputDeviceChange(mic.deviceId));
                            }}
                            showIcon={shouldShowDeviceCheckmark(mic.deviceId, audioDeviceId!, microphoneState)}
                            loading={isMicrophoneLoading(mic.deviceId)}
                            label={mic.label}
                            Icon={IcCheckmark}
                        />
                    ))}
                </div>
                {!noMicrophoneDetected && (
                    <div className="flex flex-column gap-4">
                        <div className="color-hint meet-font-weight text-uppercase text-sm">{c('Info')
                            .t`Microphone effects`}</div>
                        <div className="w-full pl-8 pr-4 ml-0.5">
                            <NoiseCancellingToggle
                                idBase="audio-settings"
                                noiseFilter={noiseFilter}
                                toggleNoiseFilter={toggleNoiseFilter}
                            />
                        </div>
                    </div>
                )}

                {!isSafari() && (
                    <div className="flex flex-column gap-2">
                        <div className="color-hint meet-font-weight text-uppercase text-sm">
                            {!noSpeakerDetected ? c('Info').t`Select a speaker` : c('Info').t`No speaker detected`}
                        </div>
                        {speakerState.systemDefault && (
                            <OptionButton
                                key={DEFAULT_DEVICE_ID}
                                onClick={() => {
                                    const isAlreadySelected = shouldShowSystemDefaultCheckmark(speakerState);
                                    if (isAlreadySelected) {
                                        return;
                                    }
                                    void withSpeakerLoading(DEFAULT_DEVICE_ID, () =>
                                        handleOutputDeviceChange(DEFAULT_DEVICE_ID)
                                    );
                                }}
                                showIcon={shouldShowSystemDefaultCheckmark(speakerState)}
                                loading={isSpeakerLoading(DEFAULT_DEVICE_ID)}
                                label={speakerState.systemDefaultLabel}
                                Icon={IcCheckmark}
                            />
                        )}
                        {speakers.map((speaker) => (
                            <OptionButton
                                key={speaker.deviceId}
                                showIcon={shouldShowDeviceCheckmark(
                                    speaker.deviceId,
                                    activeOutputDeviceId!,
                                    speakerState
                                )}
                                loading={isSpeakerLoading(speaker.deviceId)}
                                label={speaker.label}
                                onClick={() => {
                                    const isAlreadySelected = shouldShowDeviceCheckmark(
                                        speaker.deviceId,
                                        activeOutputDeviceId!,
                                        speakerState
                                    );
                                    if (isAlreadySelected) {
                                        return;
                                    }
                                    void withSpeakerLoading(speaker.deviceId, () =>
                                        handleOutputDeviceChange(speaker.deviceId)
                                    );
                                }}
                                Icon={IcCheckmark}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DeviceSettingsDropdown>
    );
};

export const AudioSettingsDropdown = React.memo(AudioSettingsDropdownComponent);

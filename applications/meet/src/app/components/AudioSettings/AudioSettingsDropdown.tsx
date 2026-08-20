import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import type { PopperPosition } from '@proton/atoms/Popper/interface';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { DEFAULT_DEVICE_ID } from '@proton/meet/constants';
import type { SliceDeviceState } from '@proton/meet/store/slices/deviceManagementSlice/types';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import { shouldShowDeviceCheckmark, shouldShowSystemDefaultCheckmark } from '@proton/meet/utils/deviceUtils';
import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { DeviceSettingsDropdown } from '../DeviceSettingsDropdown';
import { NoiseCancellingToggle } from '../Settings/NoiseCancellingToggle';

import './AudioSettingsDropdown.scss';

interface AudioSettingsDropdownProps {
    anchorRef: RefObject<HTMLButtonElement>;
    handleInputDeviceChange: (deviceId: string) => Promise<void>;
    handleOutputDeviceChange: (deviceId: string) => Promise<void>;
    audioDeviceId: string | null;
    activeOutputDeviceId: string | null;
    microphoneState: SliceDeviceState;
    speakerState: SliceDeviceState;
    microphones: SerializableDeviceInfo[];
    speakers: SerializableDeviceInfo[];
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
    const { viewportWidth } = useActiveBreakpoint();

    const speakerSelectionNotSupported = isSafari() || isFirefox();

    return (
        <DeviceSettingsDropdown anchorRef={anchorRef} anchorPosition={anchorPosition} onClose={onClose}>
            <section
                className="flex flex-column gap-4 px-4 py-2 meet-scrollbar overflow-x-hidden overflow-y-auto"
                aria-label={c('Aria').t`Audio settings`}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
            >
                <div className="flex flex-column gap-2">
                    <div className="color-weak meet-font-weight text-uppercase text-sm" id="audio-microphone-label">
                        {!noMicrophoneDetected ? c('Info').t`Select a microphone` : c('Info').t`No microphone detected`}
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                    <div role="listbox" aria-labelledby="audio-microphone-label" className="flex flex-column gap-2">
                        {microphoneState.systemDefault && (
                            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
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
                                role="option"
                                aria-selected={shouldShowSystemDefaultCheckmark(microphoneState)}
                            />
                        )}
                        {microphones.map((mic) => (
                            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
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
                                    void withMicrophoneLoading(mic.deviceId, () =>
                                        handleInputDeviceChange(mic.deviceId)
                                    );
                                }}
                                showIcon={shouldShowDeviceCheckmark(mic.deviceId, audioDeviceId!, microphoneState)}
                                loading={isMicrophoneLoading(mic.deviceId)}
                                label={mic.label}
                                Icon={IcCheckmark}
                                role="option"
                                aria-selected={shouldShowDeviceCheckmark(mic.deviceId, audioDeviceId!, microphoneState)}
                            />
                        ))}
                    </div>
                </div>
                {!noMicrophoneDetected && (
                    <div className="flex flex-column gap-4">
                        <div className="color-weak meet-font-weight text-uppercase text-sm">{c('Info')
                            .t`Microphone effects`}</div>
                        <div className="w-full pl-8 pr-4 ml-0.5">
                            <NoiseCancellingToggle
                                idBase="audio-settings"
                                noiseFilter={noiseFilter}
                                toggleNoiseFilter={toggleNoiseFilter}
                                size="medium"
                            />
                        </div>
                    </div>
                )}

                {!speakerSelectionNotSupported && (
                    <div className="flex flex-column gap-2">
                        <div className="color-weak meet-font-weight text-uppercase text-sm" id="audio-speaker-label">
                            {!noSpeakerDetected ? c('Info').t`Select a speaker` : c('Info').t`No speaker detected`}
                        </div>
                        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                        <div role="listbox" aria-labelledby="audio-speaker-label" className="flex flex-column gap-2">
                            {speakerState.hasDefaultOption && (
                                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
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
                                    role="option"
                                    aria-selected={shouldShowSystemDefaultCheckmark(speakerState)}
                                />
                            )}
                            {speakers.map((speaker) => (
                                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
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
                                    role="option"
                                    aria-selected={shouldShowDeviceCheckmark(
                                        speaker.deviceId,
                                        activeOutputDeviceId!,
                                        speakerState
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {speakerSelectionNotSupported && (
                    <div
                        className="flex flex-column gap-4 max-w-custom"
                        style={{
                            '--max-w-custom': viewportWidth['<=small'] ? 'auto' : '27em',
                        }}
                    >
                        <div className="color-weak meet-font-weight text-uppercase text-sm">
                            {c('Info').t`Select a speaker`}
                        </div>
                        <Card className="speaker-selection-not-supported-card rounded-xxl text-sm" background={false}>
                            {c('Info')
                                .t`Speaker selection isn’t available in this browser. Use your system settings to choose a different speaker.`}
                        </Card>
                    </div>
                )}
            </section>
        </DeviceSettingsDropdown>
    );
};

export const AudioSettingsDropdown = React.memo(AudioSettingsDropdownComponent);

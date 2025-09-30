import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import type { PopperPosition } from '@proton/components/components/popper/interface';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { DeviceSettingsDropdown } from '../DeviceSettingsDropdown';

interface AudioSettingsDropdownProps {
    anchorRef: RefObject<HTMLButtonElement>;
    handleInputDeviceChange: (deviceId: string) => void;
    handleOutputDeviceChange: (deviceId: string) => void;
    audioDeviceId: string | null;
    activeOutputDeviceId: string | null;
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
    onClose: () => void;
    anchorPosition?: PopperPosition;
}

const AudioSettingsDropdownComponent = ({
    anchorRef,
    handleInputDeviceChange,
    handleOutputDeviceChange,
    audioDeviceId,
    activeOutputDeviceId,
    microphones,
    speakers,
    onClose,
    anchorPosition,
}: AudioSettingsDropdownProps) => {
    const noMicrophoneDetected = microphones.length === 0;
    const noSpeakerDetected = speakers.length === 0;

    return (
        <DeviceSettingsDropdown anchorRef={anchorRef} anchorPosition={anchorPosition} onClose={onClose}>
            <div className="flex flex-column gap-2 p-2 meet-scrollbar overflow-x-hidden overflow-y-auto">
                <div className="flex flex-column gap-2">
                    <div className="color-weak meet-font-weight">
                        {!noMicrophoneDetected ? c('Info').t`Select a microphone` : c('Info').t`No microphone detected`}
                    </div>
                    {microphones.map((mic) => (
                        <OptionButton
                            key={mic.deviceId}
                            onClick={() => handleInputDeviceChange(mic.deviceId)}
                            showIcon={mic.deviceId === audioDeviceId}
                            label={mic.label}
                            Icon={IcCheckmark}
                        />
                    ))}
                </div>
                {!isSafari() && (
                    <div className="flex flex-column gap-2">
                        <div className="color-weak meet-font-weight">
                            {!noSpeakerDetected ? c('Info').t`Select a speaker` : c('Info').t`No speaker detected`}
                        </div>
                        {speakers.map((speaker) => (
                            <OptionButton
                                key={speaker.deviceId}
                                showIcon={speaker.deviceId === activeOutputDeviceId}
                                label={speaker.label}
                                onClick={() => handleOutputDeviceChange(speaker.deviceId)}
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

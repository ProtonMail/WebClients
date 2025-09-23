import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';

interface AudioSettingsDropdownProps {
    anchorRef?: RefObject<HTMLButtonElement>;
    handleInputDeviceChange: (deviceId: string) => void;
    handleOutputDeviceChange: (deviceId: string) => void;
    audioDeviceId: string | null;
    activeOutputDeviceId: string | null;
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
}

const AudioSettingsDropdownComponent = ({
    anchorRef,
    handleInputDeviceChange,
    handleOutputDeviceChange,
    audioDeviceId,
    activeOutputDeviceId,
    microphones,
    speakers,
}: AudioSettingsDropdownProps) => {
    const noMicrophoneDetected = microphones.length === 0;
    const noSpeakerDetected = speakers.length === 0;

    return (
        <Dropdown
            className="device-selector-dropdown border border-norm rounded-xl shadow-none meet-radius meet-scrollbar pl-2 pr-0 py-4 overflow-x-hidden overflow-y-auto"
            isOpen={true}
            anchorRef={anchorRef as RefObject<HTMLElement>}
            onClose={noop}
            noCaret
            originalPlacement="top-start"
            availablePlacements={['top-start']}
            disableDefaultArrowNavigation
            size={{ width: DropdownSizeUnit.Dynamic, maxWidth: undefined }}
        >
            <div className="flex flex-column gap-2 px-2 py-0 meet-scrollbar overflow-x-hidden overflow-y-auto">
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
        </Dropdown>
    );
};

export const AudioSettingsDropdown = React.memo(AudioSettingsDropdownComponent);

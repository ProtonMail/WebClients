import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownSizeUnit } from '@proton/components';
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
    return (
        <Dropdown
            className="device-selector-dropdown border border-norm rounded-xl shadow-none meet-radius meet-scrollbar p-2 overflow-x-hidden overflow-y-auto"
            isOpen={true}
            anchorRef={anchorRef as RefObject<HTMLElement>}
            onClose={noop}
            noCaret
            originalPlacement="top-start"
            availablePlacements={['top-start']}
            disableDefaultArrowNavigation
            onClick={(e) => e.stopPropagation()}
            size={{ width: DropdownSizeUnit.Dynamic, maxWidth: undefined }}
        >
            <div className="flex flex-column gap-2 p-2 meet-scrollbar overflow-x-hidden overflow-y-auto">
                <div className="flex flex-column gap-2">
                    <div className="color-weak meet-font-weight">{c('l10n_nightly Info').t`Select a microphone`}</div>
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
                        <div className="color-weak meet-font-weight">{c('l10n_nightly Info').t`Select a speaker`}</div>
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

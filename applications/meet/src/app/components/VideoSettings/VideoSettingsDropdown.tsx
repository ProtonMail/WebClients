import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownSizeUnit } from '@proton/components';
import { IcCheckmark } from '@proton/icons';
import noop from '@proton/utils/noop';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';

interface VideoSettingsDropdownProps {
    anchorRef?: RefObject<HTMLButtonElement>;
    handleCameraChange: (deviceId: string) => void;
    videoDeviceId: string | null;
    cameras: MediaDeviceInfo[];
}

const VideoSettingsDropdownComponent = ({
    anchorRef,
    handleCameraChange,
    videoDeviceId,
    cameras,
}: VideoSettingsDropdownProps) => {
    return (
        <Dropdown
            className="device-selector-dropdown border border-norm rounded-xl shadow-none meet-radius p-2 overflow-x-hidden overflow-y-auto"
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
                    <div className="color-weak meet-font-weight">{c('meet_2025 Info').t`Select a camera`}</div>
                    {cameras.map((camera) => (
                        <OptionButton
                            key={camera.deviceId}
                            showIcon={camera.deviceId === videoDeviceId}
                            label={camera.label}
                            onClick={() => handleCameraChange(camera.deviceId)}
                            Icon={IcCheckmark}
                        />
                    ))}
                </div>
            </div>
        </Dropdown>
    );
};

export const VideoSettingsDropdown = React.memo(VideoSettingsDropdownComponent);

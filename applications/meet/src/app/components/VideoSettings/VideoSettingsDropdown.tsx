import type { RefObject } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Dropdown } from '@proton/components';
import { IcCheckmark } from '@proton/icons';
import noop from '@proton/utils/noop';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { getDeviceLabel } from '../../utils/getDeviceLabel';

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
            className="border border-norm rounded-xl shadow-none meet-radius p-2"
            isOpen={true}
            anchorRef={anchorRef as RefObject<HTMLElement>}
            onClose={noop}
            noCaret
            originalPlacement="top-start"
            availablePlacements={['top-start']}
            disableDefaultArrowNavigation
            onClick={(e) => e.stopPropagation()}
            size={{ width: '20.625rem', maxWidth: '20.625rem' }}
        >
            <div className="flex flex-column gap-2 m-2 meet-scrollbar">
                <div className="flex flex-column gap-2">
                    <div className="color-weak meet-font-weight">{c('l10n_nightly Info').t`Select a camera`}</div>
                    {cameras.map((camera) => (
                        <OptionButton
                            key={camera.deviceId}
                            showIcon={camera.deviceId === videoDeviceId}
                            label={getDeviceLabel(camera)}
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

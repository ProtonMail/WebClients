import type { ReactNode, RefObject } from 'react';

import { c } from 'ttag';

import type { PopperPlacement, PopperPosition } from '@proton/atoms/Popper/interface';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';

interface DeviceSettingsDropdownProps {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
    onClose: () => void;
    anchorPosition?: PopperPosition;
    originalPlacement?: PopperPlacement;
}

export const DeviceSettingsDropdown = ({
    children,
    anchorRef,
    onClose,
    anchorPosition,
    originalPlacement = 'top-start',
}: DeviceSettingsDropdownProps) => {
    return (
        <Dropdown
            className="meet-dropdown device-selector-dropdown border border-card rounded-xl shadow-none meet-radius meet-scrollbar scrollbar-always-visible py-2 overflow-x-hidden overflow-y-auto"
            // Which of the nested boxes ends up scrolling depends on what caps the height, so every
            // one of them opts out of the global rule that hides the thumb until hover.
            contentProps={{ className: 'meet-scrollbar scrollbar-always-visible' }}
            aria-label={c('Aria').t`Device settings`}
            isOpen={true}
            anchorRef={anchorRef}
            onClose={onClose}
            noCaret
            originalPlacement={originalPlacement}
            availablePlacements={[originalPlacement]}
            disableDefaultArrowNavigation
            size={{ width: DropdownSizeUnit.Dynamic, maxWidth: undefined }}
            autoClose={false}
            autoCloseOutside={true}
            autoCloseOutsideAnchor={true}
            anchorPosition={anchorPosition}
        >
            {children}
        </Dropdown>
    );
};

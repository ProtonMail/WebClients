import type { ReactNode, RefObject } from 'react';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { PopperPlacement, PopperPosition } from '@proton/components/components/popper/interface';

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
            className="meet-dropdown device-selector-dropdown border border-card rounded-xl shadow-none meet-radius meet-scrollbar py-2 overflow-x-hidden overflow-y-auto"
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

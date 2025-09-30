import type { ReactNode, RefObject } from 'react';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { PopperPosition } from '@proton/components/components/popper/interface';

interface DeviceSettingsDropdownProps {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
    onClose: () => void;
    anchorPosition?: PopperPosition;
}

export const DeviceSettingsDropdown = ({
    children,
    anchorRef,
    onClose,
    anchorPosition,
}: DeviceSettingsDropdownProps) => {
    return (
        <Dropdown
            className="device-selector-dropdown border border-norm rounded-xl shadow-none meet-radius meet-scrollbar p-2 overflow-x-hidden overflow-y-auto"
            isOpen={true}
            anchorRef={anchorRef}
            onClose={onClose}
            noCaret
            originalPlacement="top-start"
            availablePlacements={['top-start']}
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

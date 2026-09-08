import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownSizeUnit } from '@proton/components/index';

import { CircleButton } from '../../../atoms/CircleButton/CircleButton';
import { LayoutOptions } from './LayoutOptions';
import { useLayoutOptions } from './useLayoutOptions';

// Used in ParticipantControls for larger screens
export const LayoutSelector = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { selectedOption } = useLayoutOptions();

    return (
        <>
            <CircleButton
                anchorRef={anchorRef}
                IconComponent={selectedOption.Icon}
                onClick={toggle}
                variant={isOpen ? 'active' : 'default'}
                ariaLabel={c('Action').t`Change layout`}
                ariaExpanded={isOpen}
                ariaHasPopup="listbox"
                tooltipTitle={c('Action').t`Change layout`}
            />
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="meet-dropdown meet-radius border border-card shadow-none"
                originalPlacement="top-start"
                size={{ width: DropdownSizeUnit.Dynamic, maxWidth: undefined }}
                noCaret
            >
                <LayoutOptions onClose={close} />
            </Dropdown>
        </>
    );
};

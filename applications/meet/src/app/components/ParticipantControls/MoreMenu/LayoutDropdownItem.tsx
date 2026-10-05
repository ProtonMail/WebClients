import { type RefObject, useState } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit, type Unit } from '@proton/components/components/dropdown/utils';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcMeetLayout } from '@proton/icons/icons/IcMeetLayout';
import clsx from '@proton/utils/clsx';

import { LayoutOptions } from '../../ParticipantsLayout/LayoutSelector/LayoutOptions';
import type { LayoutOptionsState } from '../../ParticipantsLayout/LayoutSelector/useLayoutOptions';
import { MoreMenuButtonItem } from './MoreMenuItems';

interface Props extends LayoutOptionsState {
    /** The dropdown matches the width of this element. */
    containerRef: RefObject<HTMLElement>;
    onLayoutSelected: () => void;
}

export const LayoutDropdownItem = ({ options, selectedOption, containerRef, onLayoutSelected }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [width, setWidth] = useState<Unit>();

    const handleToggle = () => {
        if (!isOpen && containerRef.current) {
            setWidth(`${containerRef.current.getBoundingClientRect().width}px`);
        }
        toggle();
    };

    return (
        <>
            <MoreMenuButtonItem
                buttonRef={anchorRef}
                Icon={IcMeetLayout}
                label={c('Action').t`Layout`}
                onClick={handleToggle}
                ariaExpanded={isOpen}
                ariaHasPopup="listbox"
                rightContent={
                    <>
                        <span className="color-weak shrink-0">{selectedOption.label}</span>
                        <IcChevronDown className={clsx('color-norm shrink-0', isOpen && 'rotateX-180')} size={4} />
                    </>
                }
            />
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="more-menu-layout-submenu more-menu-layout-dropdown meet-dropdown border-card"
                originalPlacement="top"
                availablePlacements={['top']}
                offset={12}
                size={{ width: width ?? DropdownSizeUnit.Anchor, maxWidth: width }}
                adaptiveForTouchScreens={false}
                noCaret
            >
                <LayoutOptions
                    options={options}
                    className="more-menu-layout-options gap-1 py-3 px-5"
                    onClose={() => {
                        close();
                        onLayoutSelected();
                    }}
                />
            </Dropdown>
        </>
    );
};

import { type RefObject, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcMeetLayout } from '@proton/icons/icons/IcMeetLayout';

import { LayoutOptions } from '../../ParticipantsLayout/LayoutSelector/LayoutOptions';
import type { LayoutOptionsState } from '../../ParticipantsLayout/LayoutSelector/useLayoutOptions';
import { MoreMenuButtonItem } from './MoreMenuItems';

interface Props extends LayoutOptionsState {
    menuRef: RefObject<HTMLElement>;
    onOpenChange: (isOpen: boolean) => void;
    onCloseMenu: () => void;
}

export const LayoutSubmenuItem = ({ options, selectedOption, menuRef, onOpenChange, onCloseMenu }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const submenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        onOpenChange(true);
        return () => onOpenChange(false);
    }, [isOpen, onOpenChange]);

    // Both menus live in separate portals, so neither can tell on its own whether a click landed
    // in the other one: clicks in the parent menu only close the submenu, clicks outside both close both.
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = ({ target }: MouseEvent) => {
            const node = target as Node;
            if (submenuRef.current?.contains(node) || anchorRef.current?.contains(node)) {
                return;
            }

            close();
            if (!menuRef.current?.contains(node)) {
                onCloseMenu();
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside, { capture: true });
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside, { capture: true });
        };
    }, [isOpen, close, onCloseMenu, anchorRef, menuRef]);

    return (
        <>
            <MoreMenuButtonItem
                buttonRef={anchorRef}
                Icon={IcMeetLayout}
                label={c('Action').t`Layout`}
                onClick={toggle}
                ariaExpanded={isOpen}
                ariaHasPopup="listbox"
                rightContent={
                    <>
                        <span className="color-weak shrink-0">{selectedOption.label}</span>
                        <IcChevronRight className="more-menu-item-icon color-weak shrink-0" size={4} />
                    </>
                }
            />
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="more-menu-layout-submenu meet-dropdown border-card"
                originalPlacement="right-start"
                availablePlacements={['right-start', 'right-end', 'left-start', 'left-end']}
                offset={13}
                size={{ width: '15rem', maxWidth: '15rem' }}
                autoCloseOutside={false}
                contentProps={{ ref: submenuRef }}
                noCaret
            >
                <LayoutOptions
                    options={options}
                    className="more-menu-layout-options items-start gap-0.5 py-3 px-2"
                    onClose={() => {
                        close();
                        onCloseMenu();
                    }}
                />
            </Dropdown>
        </>
    );
};

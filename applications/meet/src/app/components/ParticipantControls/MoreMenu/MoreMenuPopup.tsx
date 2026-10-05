import { type RefObject, useRef, useState } from 'react';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';

import type { LayoutOptionsState } from '../../ParticipantsLayout/LayoutSelector/useLayoutOptions';
import { LayoutSubmenuItem } from './LayoutSubmenuItem';
import { type MoreMenuAction, MoreMenuSections, type MoreMenuToggle } from './MoreMenuItems';

interface Props {
    isOpen: boolean;
    anchorRef: RefObject<HTMLButtonElement>;
    onClose: () => void;
    toggles: MoreMenuToggle[];
    actions: MoreMenuAction[];
    layout?: LayoutOptionsState;
}

export const MoreMenuPopup = ({ isOpen, anchorRef, onClose, toggles, actions, layout }: Props) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isLayoutSubmenuOpen, setIsLayoutSubmenuOpen] = useState(false);

    return (
        <Dropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            className="more-menu-popup meet-dropdown meet-radius border-card"
            originalPlacement="top"
            availablePlacements={['top', 'top-end', 'top-start']}
            offset={16}
            size={{ width: '20rem', maxWidth: '20rem', maxHeight: DropdownSizeUnit.Viewport }}
            autoClose={false}
            autoCloseOutside={!isLayoutSubmenuOpen}
            aria-label={c('Label').t`More options`}
            noCaret
        >
            <div ref={menuRef} className="flex flex-column flex-nowrap items-start gap-0.5 py-3 px-2">
                <MoreMenuSections
                    toggles={toggles}
                    layoutItem={
                        layout && (
                            <LayoutSubmenuItem
                                {...layout}
                                menuRef={menuRef}
                                onOpenChange={setIsLayoutSubmenuOpen}
                                onCloseMenu={onClose}
                            />
                        )
                    }
                    actions={actions}
                    onClose={onClose}
                    dividerClassName="my-0.5"
                />
            </div>
        </Dropdown>
    );
};

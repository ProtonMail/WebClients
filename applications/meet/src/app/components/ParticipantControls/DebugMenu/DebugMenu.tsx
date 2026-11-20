import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { IcBug } from '@proton/icons/icons/IcBug';

import { CircleButton } from '../../../atoms/CircleButton/CircleButton';
import { type MoreMenuAction, MoreMenuSections } from '../MoreMenu/MoreMenuItems';

import '../MoreMenu/MoreMenu.scss';

interface Props {
    actions: MoreMenuAction[];
}

export const DebugMenu = ({ actions }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    if (actions.length === 0) {
        return null;
    }

    return (
        <>
            <CircleButton
                anchorRef={anchorRef}
                IconComponent={IcBug}
                onClick={toggle}
                variant={isOpen ? 'active' : 'default'}
                ariaLabel={c('Alt').t`Debug`}
                ariaExpanded={isOpen}
                ariaHasPopup="dialog"
                tooltipTitle={c('Info').t`Debug`}
                tooltipDisabled={isOpen}
            />
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="more-menu-popup meet-dropdown meet-radius border-card"
                originalPlacement="top"
                availablePlacements={['top', 'top-end', 'top-start']}
                offset={16}
                size={{ width: '20rem', maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
                autoClose={false}
                aria-label={c('Label').t`Debug`}
                noCaret
            >
                <div className="flex flex-column flex-nowrap items-start gap-0.5 py-3 px-2">
                    <MoreMenuSections toggles={[]} actions={actions} onClose={close} dividerClassName="my-0.5" />
                </div>
            </Dropdown>
        </>
    );
};

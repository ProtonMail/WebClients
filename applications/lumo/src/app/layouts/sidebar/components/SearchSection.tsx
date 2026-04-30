import { c } from 'ttag';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { metaKey } from '@proton/shared/lib/helpers/browser';

import { useSidebar } from '../../../providers/SidebarProvider';
import { SidebarItem } from './SidebarItem';

interface Props {
    onSearchClick: () => void;
}

export const SearchSection = ({ onSearchClick }: Props) => {
    const { isSmallScreen } = useSidebar();

    return (
        <SidebarItem
            icon="magnifier"
            label={c('collider_2025:Button').t`Search`}
            onClick={onSearchClick}
            shortcut={!isSmallScreen ? `${metaKey}+K` : undefined}
            showShortcutOnHover
        />
    );
};

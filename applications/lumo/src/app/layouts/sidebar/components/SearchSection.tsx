import { c } from 'ttag';

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
            icon={IcMagnifier}
            label={c('collider_2025:Button').t`Search`}
            onClick={onSearchClick}
            shortcut={!isSmallScreen ? `${metaKey}+K` : undefined}
            showShortcutOnHover
        />
    );
};

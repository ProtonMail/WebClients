import { clsx } from 'clsx';
import { c } from 'ttag';

import { UserDropdown, useConfig } from '@proton/components';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';
import { SidebarItem } from './SidebarItem';

interface Props {
    showText: boolean;
}

const CollapseToggle = ({ showText, className }: { showText: boolean; className?: string }) => {
    const { toggle, isCollapsed } = useSidebar();
    return (
        <SidebarItem
            icon={isCollapsed ? 'chevron-right' : 'chevron-left'}
            label={isCollapsed ? c('collider_2025:Button').t`Show sidebar` : c('collider_2025:Button').t`Hide sidebar`}
            onClick={toggle}
            showText={showText}
            className={className}
        />
    );
};

/**
 * Renders the bottom user/toggle area based on auth state and screen size:
 *
 * | isSmallScreen | isGuest | Renders                         |
 * |---------------|---------|---------------------------------|
 * | false         | false   | UserDropdown + CollapseToggle   |
 * | false         | true    | CollapseToggle only             |
 * | true          | false   | UserDropdown only               |
 * | true          | true    | Nothing (overlay backdrop handles dismiss) |
 */
export const SidebarBottomUserArea = ({ showText }: Props) => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const { APP_NAME } = useConfig();

    if (isGuest) {
        if (!isSmallScreen) {
            return <CollapseToggle showText={showText} />;
        }
        // Mobile guests have no collapse toggle; the sidebar backdrop handles dismissal.
        return null;
    }

    if (isSmallScreen) {
        return (
            <div className="sidebar-bottom-user-dropdown mobile-user-dropdown shrink-0">
                <UserDropdown app={APP_NAME} dropdownIcon={undefined} className="border-none" />
            </div>
        );
    }

    return (
        <div className="desktop-sidebar-user-dropdown flex flex-row flex-nowrap items-center gap-2 justify-space-between">
            <div className={clsx('w-3/4', showText ? 'block' : 'hidden')}>
                <div className="sidebar-item-text">
                    <UserDropdown app={APP_NAME} dropdownIcon={undefined} />
                </div>
            </div>
            <CollapseToggle showText={false} className="mr-0 w-auto" />
        </div>
    );
};

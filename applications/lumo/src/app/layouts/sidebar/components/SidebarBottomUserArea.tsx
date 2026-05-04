import { c } from 'ttag';

import { UserDropdown, useConfig } from '@proton/components';

import LumoUserDropdown from '../../../components/LumoUserDropdown/LumoUserDropdown';
import { useLumoAuthAction } from '../../../hooks/useLumoAuthAction';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';
import LumoUserDropdownContent from '../../header/LumoUserDropdownContent';
import { SidebarItem } from './SidebarItem';

const CollapseToggle = ({ className }: { className?: string }) => {
    const { toggle } = useSidebar();
    return (
        <SidebarItem
            icon="chevron-left"
            label={c('collider_2025:Button').t`Hide sidebar`}
            onClick={toggle}
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
export const SidebarBottomUserArea = () => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const { APP_NAME } = useConfig();
    const { isEnabled: isNativeAuthEnabled } = useLumoAuthAction();

    if (isGuest) {
        if (!isSmallScreen) {
            return <CollapseToggle />;
        }
        // Mobile guests have no collapse toggle; the sidebar backdrop handles dismissal.
        return null;
    }

    const DropdownComponent = isNativeAuthEnabled ? LumoUserDropdown : UserDropdown;

    if (isSmallScreen) {
        return (
            <div className="sidebar-bottom-user-dropdown mobile-user-dropdown shrink-0">
                <DropdownComponent app={APP_NAME} dropdownIcon={undefined} className="border-none" />
                {/* <UserDropdown app={APP_NAME} dropdownIcon={undefined} className="border-none">
                    <LumoUserDropdownContent />
                </UserDropdown> */}
            </div>
        );
    }

    return (
        <div className="desktop-sidebar-user-dropdown flex flex-row flex-nowrap items-center gap-2 justify-space-between">
            <div className="w-3/4">
                <div className="sidebar-item-text">
                    <DropdownComponent app={APP_NAME} dropdownIcon={undefined} />
                    {/* <UserDropdown app={APP_NAME} dropdownIcon={undefined} className="border-none">
                        <LumoUserDropdownContent />
                    </UserDropdown> */}
                </div>
            </div>
            {/* <CollapseToggle className="mr-0 w-auto" /> */}
        </div>
    );
};

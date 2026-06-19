import { UserDropdown, useConfig } from '@proton/components';

import LumoUserDropdown from '../../../components/LumoUserDropdown/LumoUserDropdown';
import LumoUserDropdownContent from '../../../components/LumoUserDropdown/LumoUserDropdownContent';
import { useLumoAuthAction } from '../../../hooks/useLumoAuthAction';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';

export const SidebarBottomUserArea = () => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const { APP_NAME } = useConfig();
    const { isEnabled: isNativeAuthEnabled } = useLumoAuthAction();

    if (isGuest) {
        return null;
    }

    const dropdownProps = {
        app: APP_NAME,
        dropdownIcon: undefined as undefined,
        className: isSmallScreen ? 'border-none' : undefined,
    };

    const userDropdown = isNativeAuthEnabled ? (
        <LumoUserDropdown {...dropdownProps} />
    ) : (
        <UserDropdown {...dropdownProps}>
            <LumoUserDropdownContent />
        </UserDropdown>
    );

    if (isSmallScreen) {
        return <div className="sidebar-bottom-user-dropdown mobile-user-dropdown shrink-0 w-full">{userDropdown}</div>;
    }

    return (
        <div className="desktop-sidebar-user-dropdown flex flex-row flex-nowrap items-center gap-2 justify-space-between">
            <div className="sidebar-item-text w-full">{userDropdown}</div>
        </div>
    );
};

import { UserDropdown, useConfig } from '@proton/components';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';
import LumoUserDropdownContent from '../../header/LumoUserDropdownContent';

export const SidebarBottomUserArea = () => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const { APP_NAME } = useConfig();

    if (isGuest) {
        return null;
    }


    if (isSmallScreen) {
        return (
            <div className="sidebar-bottom-user-dropdown mobile-user-dropdown shrink-0 w-full">
                <UserDropdown app={APP_NAME} dropdownIcon={undefined} className="border-none">
                    <LumoUserDropdownContent />
                </UserDropdown>
            </div>
        );
    }

    return (
        <div className="desktop-sidebar-user-dropdown flex flex-row flex-nowrap items-center gap-2 justify-space-between">
            <div className="sidebar-item-text w-full">
                <UserDropdown app={APP_NAME} dropdownIcon={undefined} className="border-none">
                    <LumoUserDropdownContent />
                </UserDropdown>
            </div>
        </div>
    );
};

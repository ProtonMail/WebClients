import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';

export interface SidebarVisibility {
    isSmallScreen: boolean;
    isGuest: boolean;
    showMobileHeader: boolean;
    showSearch: boolean;
    showGallery: boolean;
    showLibrary: boolean;
    showUserDropdown: boolean;
    showCollapseToggle: boolean;
    showSchedules: boolean;
    showCustomize: boolean;
}

export const useSidebarVisibility = (): SidebarVisibility => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const { imageTools, artifactsView, schedules, customAgents } = useLumoFlags();

    return {
        isSmallScreen,
        isGuest,
        showMobileHeader: isSmallScreen,
        // Search is hidden only for guests
        showSearch: !isGuest,
        // Images page (Gallery / Create) when only image tools are enabled; Library when artifacts view is on.
        showGallery: imageTools && !artifactsView,
        showLibrary: artifactsView,
        showUserDropdown: !isGuest,
        // Collapse toggle is desktop-only regardless of auth state
        showCollapseToggle: !isSmallScreen,
        showSchedules: schedules && !isGuest,
        showCustomize: customAgents && !isGuest,
    };
};

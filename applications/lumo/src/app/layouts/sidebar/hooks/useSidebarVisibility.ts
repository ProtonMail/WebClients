import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';

export interface SidebarVisibility {
    isSmallScreen: boolean;
    isGuest: boolean;
    showMobileHeader: boolean;
    showSearch: boolean;
    showGallery: boolean;
    showUserDropdown: boolean;
    showCollapseToggle: boolean;
}

export const useSidebarVisibility = (): SidebarVisibility => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const { imageTools } = useLumoFlags();

    return {
        isSmallScreen,
        isGuest,
        showMobileHeader: isSmallScreen,
        // Search is hidden only for guests on mobile
        showSearch: !(isSmallScreen && isGuest),
        showGallery: imageTools,
        showUserDropdown: !isGuest,
        // Collapse toggle is desktop-only regardless of auth state
        showCollapseToggle: !isSmallScreen,
    };
};

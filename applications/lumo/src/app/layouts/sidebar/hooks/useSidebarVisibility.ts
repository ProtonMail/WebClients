import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';

export interface SidebarVisibility {
    isSmallScreen: boolean;
    isGuest: boolean;
    showMobileHeader: boolean;
    showSearch: boolean;
    showLibrary: boolean;
    showUserDropdown: boolean;
    showCollapseToggle: boolean;
}

export const useSidebarVisibility = (): SidebarVisibility => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const { imageTools, artifactsView } = useLumoFlags();

    return {
        isSmallScreen,
        isGuest,
        showMobileHeader: isSmallScreen,
        // Search is hidden only for guests
        showSearch: !isGuest,
        // The Library holds generated images (imageTools) and artifacts (artifactsView).
        showLibrary: imageTools || artifactsView,
        showUserDropdown: !isGuest,
        // Collapse toggle is desktop-only regardless of auth state
        showCollapseToggle: !isSmallScreen,
    };
};

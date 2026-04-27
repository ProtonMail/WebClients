import { useCallback, useEffect } from 'react';

import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useSidebar } from '../../../providers/SidebarProvider';
import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { canShowWebComposer } from '../../../util/userAgent';

interface NativeComposerVisibilityConfig {
    showDrawingModal?: boolean; // true when drawing
    showNewModal?: boolean; // true when the new feature modal is visible
    showFileModal?: boolean; // true when previewing a file
    /**
     * Set to true for components that always hide the composer while mounted
     * (e.g. KnowledgeBasePanel, ProjectsView). On unmount, visibility is
     * restored based on the standard conditions (flag + sidebar).
     */
    isBlocking?: boolean;
}

export const useNativeComposerVisibilityApi = ({
    showDrawingModal = false,
    showNewModal = false,
    showFileModal = false,
    isBlocking = false,
}: NativeComposerVisibilityConfig = {}) => {
    const { isVisible: isSidebarVisible } = useSidebar();
    const { nativeComposer: lumoNativeComposerEnabled } = useLumoFlags();

    useEffect(() => {
        if (isBlocking) {
            setNativeComposerVisibility(false);
            return () => {
                setNativeComposerVisibility(lumoNativeComposerEnabled && !isSidebarVisible);
            };
        }

        setNativeComposerVisibility(
            lumoNativeComposerEnabled && !isSidebarVisible && !showDrawingModal && !showNewModal && !showFileModal
        );
    }, [isBlocking, lumoNativeComposerEnabled, isSidebarVisible, showDrawingModal, showNewModal]);

    const toggle = useCallback(() => {
        setNativeComposerVisibility(lumoNativeComposerEnabled);
    }, [lumoNativeComposerEnabled]);

    const showWebComposer = function (): boolean {
        return canShowWebComposer(lumoNativeComposerEnabled);
    };

    return {
        toggle,
        showWebComposer,
    };
};

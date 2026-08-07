import { useEffect, useRef } from 'react';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { getNativeSidebarLayout, readSidebarMetrics } from '../../../layouts/sidebar/sidebarMetrics';
import { useSidebar } from '../../../providers/SidebarProvider';
import { setNativeSidebarLayout } from '../../../remote/nativeComposerBridgeHelpers';

/**
 * Reports the sidebar's target width to native on large screens, so the native composer can size
 * itself to the space that is left and start its own animation at the same moment the CSS
 * transition does.
 *
 * Mount this exactly once (MainLayoutContent). Folding it into `useNativeComposerVisibilityApi`
 * would look tempting, but several views mount that hook simultaneously and the ref below has to
 * be per-app, not per-consumer.
 */
export const useNativeSidebarLayoutApi = () => {
    const { isVisible } = useSidebar();
    const { isSmallScreen } = useIsLumoSmallScreen();
    // The last large-screen width reported to native, or `null` if none has been reported yet
    // (including after an unmount, which resets this). `animate` means "the width actually
    // changed since the last report", not just "this isn't the first report" — under
    // React.StrictMode, effect setup can run twice on the same mounted instance (setup → cleanup
    // → setup) with this ref preserved across both, so counting reports rather than tracking the
    // reported value would emit a spurious animated push on the second setup.
    const lastReportedWidth = useRef<number | null>(null);

    useEffect(() => {
        const metrics = readSidebarMetrics();
        const width = isSmallScreen ? null : isVisible ? metrics.expandedWidth : 0;
        const animate = lastReportedWidth.current !== null && width !== null && width !== lastReportedWidth.current;

        setNativeSidebarLayout(
            getNativeSidebarLayout({
                isSmallScreen,
                isSidebarVisible: isVisible,
                animate,
                metrics,
            })
        );
        lastReportedWidth.current = width;
    }, [isSmallScreen, isVisible]);

    // Separate, dep-free effect so this cleanup only ever runs on unmount — not on every
    // isSmallScreen/isVisible change, which would otherwise clobber the effect above's `animate`
    // computation. Some views (e.g. /ai-paper-trail) render outside MainLayoutContent, so this
    // hook can unmount while a non-null `sidebar` is still the last thing native received; reset
    // it so a full-screen view doesn't stay inset for a sidebar that's no longer there, and clear
    // the ref so a later mount snaps to the current width instead of animating to it.
    useEffect(() => {
        return () => {
            setNativeSidebarLayout(null);
            lastReportedWidth.current = null;
        };
    }, []);
};

import { useEffect, useRef } from 'react';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useOptionalSidebar } from '../../../providers/SidebarProvider';
import { setNativeComposerVisibility, setNativeIsSmallScreen } from '../../../remote/nativeComposerBridgeHelpers';
import { canShowWebComposer, canUseNativeSidebarLayout } from '../../../util/userAgent';

interface NativeComposerVisibilityConfig {
    /**
     * True while this component covers the composer — a modal, a full-screen panel, a route that
     * replaces the chat. The composer stays hidden until this turns false or the component
     * unmounts, and then goes back to the default.
     */
    hideComposer?: boolean;
}

/**
 * The default visibility: what the composer's own conditions call for when nothing is covering
 * it — the native composer flag, and whether the sidebar left it any room.
 */
const useDefaultVisibility = (): boolean => {
    // A route with no sidebar layout (the paper trail) has nothing competing for the screen.
    const isSidebarVisible = useOptionalSidebar()?.isVisible ?? false;
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { nativeComposer: lumoNativeComposerEnabled } = useLumoFlags();

    const shouldShowNativeComposer = isSmallScreen
        ? !isSidebarVisible // phone: the sidebar drawer covers the screen
        : canUseNativeSidebarLayout() || isSidebarVisible; // large: always, or legacy behavior

    return lumoNativeComposerEnabled && shouldShowNativeComposer;
};

const useNativeComposerVisibility = ({
    hideComposer,
    isComposerHost,
}: {
    hideComposer: boolean;
    isComposerHost: boolean;
}) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { nativeComposer: lumoNativeComposerEnabled } = useLumoFlags();
    const defaultVisibility = useDefaultVisibility();

    useEffect(() => {
        setNativeIsSmallScreen(isSmallScreen);
    }, [isSmallScreen]);

    // Read when restoring rather than when hiding: the sidebar may have moved in between.
    const defaultVisibilityRef = useRef(defaultVisibility);
    useEffect(() => {
        defaultVisibilityRef.current = defaultVisibility;
    }, [defaultVisibility]);

    useEffect(() => {
        if (!hideComposer) {
            return;
        }

        setNativeComposerVisibility(false);
        return () => {
            setNativeComposerVisibility(defaultVisibilityRef.current);
        };
    }, [hideComposer]);

    useEffect(() => {
        if (!isComposerHost || hideComposer) {
            return;
        }

        setNativeComposerVisibility(defaultVisibility);
    }, [isComposerHost, hideComposer, defaultVisibility]);

    const showWebComposer = function (): boolean {
        return canShowWebComposer(lumoNativeComposerEnabled);
    };

    return {
        showWebComposer,
    };
};

/**
 * For anything that can cover the native composer. It only ever hides: while `hideComposer` is
 * true, and it puts the default back when it stops. With nothing to cover it says nothing at all,
 * so a component that lives for the whole session (the sidebar user menu) can't uncover a composer
 * that something else is covering.
 */
export const useNativeComposerVisibilityApi = ({ hideComposer = false }: NativeComposerVisibilityConfig = {}) =>
    useNativeComposerVisibility({ hideComposer, isComposerHost: false });

/**
 * For the component that renders the composer, and only that one. On top of the hiding above, it
 * sends the default visibility to native on mount and whenever it changes — which is the only way
 * the composer ever comes back.
 *
 * Two of these mounted at once would fight: whenever one re-rendered it would send the default and
 * uncover a composer the other is hiding.
 */
export const useNativeComposerHostVisibilityApi = ({ hideComposer = false }: NativeComposerVisibilityConfig = {}) =>
    useNativeComposerVisibility({ hideComposer, isComposerHost: true });

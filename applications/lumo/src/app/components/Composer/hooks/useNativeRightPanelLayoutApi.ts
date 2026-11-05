import { type RefObject, useLayoutEffect } from 'react';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useArtifactPanelHostLayout } from '../../../providers/ArtifactPanelHostProvider';
import { useRightPanel } from '../../../providers/RightPanelProvider';
import { setNativeRightPanelWidth } from '../../../remote/nativeComposerBridgeHelpers';
import { canUseNativeRightPanelLayout } from '../../../util/userAgent';

/**
 * Mount once in MainLayoutContent. Measure chat rather than assuming drawer or artifact widths,
 * and report before visibility effects so native can fit its overlay to the same viewport.
 */
export const useNativeRightPanelLayoutApi = (chatRef: RefObject<HTMLElement | null>): void => {
    const { isOpen } = useRightPanel();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { isHostVisible } = useArtifactPanelHostLayout();
    const supported = canUseNativeRightPanelLayout();

    useLayoutEffect(() => {
        if (!supported) {
            return;
        }
        const chat = chatRef.current;
        if (isSmallScreen || (!isOpen && !isHostVisible) || !chat) {
            setNativeRightPanelWidth(0);
            return;
        }
        const update = () => {
            const bounds = chat.getBoundingClientRect();
            const width = getComputedStyle(chat).direction === 'rtl' ? bounds.left : window.innerWidth - bounds.right;
            setNativeRightPanelWidth(Math.max(0, width));
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(chat);
        window.addEventListener('resize', update);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, [chatRef, isOpen, isHostVisible, isSmallScreen, supported]);

    useLayoutEffect(() => {
        if (supported) {
            return () => setNativeRightPanelWidth(0);
        }
    }, [supported]);
};

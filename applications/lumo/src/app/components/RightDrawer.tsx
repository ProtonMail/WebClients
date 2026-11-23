import { useLayoutEffect, useRef } from 'react';

import { clsx } from 'clsx';

import { useRightPanel } from '../providers/RightPanelProvider';

import './RightDrawer.scss';

interface RightDrawerProps {
    className?: string;
    isFullscreen?: boolean;
    onClose?: () => void;
}

/**
 * Responsive right panel that adapts to screen size:
 * - Large screens: Sits as a flex sibling and pushes main content left
 * - Small screens: Overlays content with backdrop (modal-like behavior)
 * Page-level components inject content via RightPanelSlot, which portals into the
 * content div registered here.
 */
export const RightDrawer = ({ className, isFullscreen, onClose }: RightDrawerProps) => {
    const { registerContentEl, isOverlay } = useRightPanel();
    const contentRef = useRef<HTMLDivElement>(null);

    // Register the content element in a layout effect instead of a ref callback.
    // Ref callbacks run during commit and can trigger provider setState while a
    // consumer such as ConversationComponent is still rendering.
    useLayoutEffect(() => {
        registerContentEl(contentRef.current);
        return () => registerContentEl(null);
    }, [registerContentEl]);

    return (
        <>
            {/* Backdrop for mobile overlay */}
            {isOverlay && (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div className="right-drawer-backdrop" onClick={onClose}></div>
            )}
            <aside
                className={clsx(
                    'right-drawer flex flex-column h-full overflow-hidden radius-16 lumo-bg-panel',
                    isFullscreen && 'right-drawer--fullscreen',
                    isOverlay && 'right-drawer--overlay',
                    className
                )}
            >
                <div
                    ref={contentRef}
                    className="right-drawer-content flex flex-column flex-1 overflow-auto w-full min-w-0 max-w-full"
                />
            </aside>
        </>
    );
};

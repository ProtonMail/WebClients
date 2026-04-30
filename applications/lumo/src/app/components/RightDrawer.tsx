import React from 'react';

import { clsx } from 'clsx';

import { useRightPanel } from '../providers/RightPanelProvider';
import { DrawerToggleButton } from './Conversation/Header';

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

    return (
        <>
            {/* Backdrop for mobile overlay */}
            {isOverlay && (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div className="right-drawer-backdrop" onClick={onClose}></div>
            )}
            <aside
                className={clsx(
                    'right-drawer rounded-xl flex flex-column h-full overflow-hidden',
                    isFullscreen && 'right-drawer--fullscreen',
                    isOverlay && 'right-drawer--overlay',
                    className
                )}
            >
                <div className="right-drawer-header w-full flex flex-row items-center justify-end px-3 py-2 shrink-0">
                    {/* {onClose && (
                        <button
                            className="flex items-center justify-center interactive-pseudo-inset rounded-sm"
                            onClick={onClose}
                            aria-label="Close panel"
                            style={{ width: '32px', height: '32px' }}
                        >
                            {isSmallScreen ? '✕' : '☰'}
                        </button>
                    )} */}
                    <DrawerToggleButton />
                </div>
                <div
                    ref={registerContentEl}
                    className="right-drawer-content flex flex-column flex-1 overflow-auto w-full"
                />
            </aside>
        </>
    );
};

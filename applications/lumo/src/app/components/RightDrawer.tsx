import React from 'react';

import { clsx } from 'clsx';

import './RightDrawer.scss';

interface RightDrawerProps {
    children: React.ReactNode;
    className?: string;
    isFullscreen?: boolean;
}

/**
 * Inline right panel that sits as a flex sibling and pushes the main content left.
 * The parent container must be a flex row.
 * Pass isFullscreen to expand it to cover the entire viewport.
 */
export const RightDrawer = ({ children, className, isFullscreen }: RightDrawerProps) => {
    return (
        <aside
            className={clsx(
                'right-drawer flex flex-column h-full overflow-hidden',
                isFullscreen && 'right-drawer--fullscreen',
                className
            )}
        >
            {children}
        </aside>
    );
};

import React from 'react';

import { clsx } from 'clsx';

import './RightDrawer.scss';

interface RightDrawerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Inline right panel that sits as a flex sibling and pushes the main content left.
 * The parent container must be a flex row.
 */
export const RightDrawer = ({ children, className }: RightDrawerProps) => {
    return (
        <div className={clsx('right-drawer', className)} role="complementary">
            {children}
        </div>
    );
};

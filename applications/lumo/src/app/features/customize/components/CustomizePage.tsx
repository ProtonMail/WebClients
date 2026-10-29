import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import './CustomizePage.scss';

interface CustomizePageProps {
    className?: string;
    /** Fit the page to the window so a child with `flex: 1` scrolls on its own instead of the page. */
    fill?: boolean;
    children: ReactNode;
}

/** Scrolling page body shared by the Customize screens, so they all have the same width. */
export const CustomizePage = ({ className, fill = false, children }: CustomizePageProps) => (
    <div className="customize-page w-full flex-1 overflow-auto px-6 pb-10 pt-8">
        <div className={clsx('customize-page__inner', fill && 'customize-page__inner--fill', className)}>
            {children}
        </div>
    </div>
);

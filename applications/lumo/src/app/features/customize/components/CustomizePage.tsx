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
    <div className="customize-page flex-1 w-full px-8 pt-2 pb-10 overflow-auto">
        <div
            className={clsx(
                'customize-page__inner w-full max-w-custom mx-auto',
                fill && 'customize-page__inner--fill',
                className
            )}
            style={{ '--max-w-custom': '60rem' }}
        >
            {children}
        </div>
    </div>
);

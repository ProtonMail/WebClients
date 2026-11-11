import type { ReactNode } from 'react';

import './layout.scss';

/** This flow always renders on the dark Storefront theme (see getThemeFromLocation.ts). */
const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex *:min-size-auto flex-nowrap flex-column h-full overflow-auto relative scroll-smooth business-referral-signup business-referral-signup-bg">
            <div
                className="relative z-1 flex flex-column flex-nowrap shrink-0 min-h-custom"
                style={{ '--min-h-custom': '100%' }}
            >
                {children}
            </div>
        </div>
    );
};

export default Layout;

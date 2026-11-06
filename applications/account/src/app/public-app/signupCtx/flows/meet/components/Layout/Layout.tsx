import type { ReactNode } from 'react';

import './layout.scss';

const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="*:min-size-auto h-full overflow-auto relative scroll-smooth flex-1 min-h-0 w-full flex flex-column flex-nowrap relative meet-signup meet-signup-variables meet-container-padding-x">
            <div>{children}</div>
        </div>
    );
};

export default Layout;

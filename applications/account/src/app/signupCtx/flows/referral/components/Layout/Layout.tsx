import type { ReactNode } from 'react';

import './layout.scss';

const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex *:min-size-auto flex-nowrap flex-column h-full overflow-auto relative signup signup-bg-gradient">
            <div>{children}</div>
        </div>
    );
};

export default Layout;

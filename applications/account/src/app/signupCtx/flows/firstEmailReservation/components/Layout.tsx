import type { ReactNode } from 'react';

const Layout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex *:min-size-auto flex-nowrap flex-column h-full overflow-auto relative scroll-smooth">
            <div>{children}</div>
        </div>
    );
};

export default Layout;

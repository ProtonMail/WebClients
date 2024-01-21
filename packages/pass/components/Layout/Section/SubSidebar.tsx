import type { FC17 } from 'react';

import './SubSidebar.scss';

export const SubSidebar: FC17 = ({ children }) => (
    <div id="pass-sub-sidebar" className="flex-1 relative">
        {children}
    </div>
);

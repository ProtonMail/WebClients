import type { FC } from 'react';

import './SubSidebar.scss';

export const SubSidebar: FC = ({ children }) => (
    <div id="pass-sub-sidebar" className="flex-item-fluid relative">
        {children}
    </div>
);

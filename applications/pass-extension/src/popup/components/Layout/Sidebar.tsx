import type { FC } from 'react';

import './Sidebar.scss';

export const Sidebar: FC = ({ children }) => (
    <div id="sidebar" className="flex-item-fluid relative">
        {children}
    </div>
);

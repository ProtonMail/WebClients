import type { FC, PropsWithChildren } from 'react';

import './Content.scss';

export const Content: FC<PropsWithChildren> = ({ children }) => (
    <div id="content" className="z-up">
        {children}
    </div>
);

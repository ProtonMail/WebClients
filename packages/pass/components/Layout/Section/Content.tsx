import type { FC, PropsWithChildren } from 'react';

import './Content.scss';

export const Content: FC<PropsWithChildren> = ({ children }) => {
    return <div id="content">{children}</div>;
};

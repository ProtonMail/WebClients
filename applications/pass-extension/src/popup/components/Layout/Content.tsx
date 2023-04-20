import type { FC } from 'react';

import './Content.scss';

export const Content: FC = ({ children }) => {
    return <div id="content">{children}</div>;
};

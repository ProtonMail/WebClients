import { type FC, type PropsWithChildren } from 'react';

import './Counter.scss';

export const Counter: FC<PropsWithChildren> = ({ children }) => {
    return <div className="pass--counter-circle border rounded-full py-1 px-3">{children}</div>;
};

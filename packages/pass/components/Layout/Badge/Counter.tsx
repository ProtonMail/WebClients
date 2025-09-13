import type { FC, PropsWithChildren } from 'react';

import './Counter.scss';

export const Counter: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="pass--counter-circle border rounded-full flex items-center justify-center shrink-0">
            <span>{children}</span>
        </div>
    );
};

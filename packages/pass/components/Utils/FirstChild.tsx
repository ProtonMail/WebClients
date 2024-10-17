import type { FC, PropsWithChildren } from 'react';
import { Children, cloneElement, isValidElement } from 'react';

import './FirstChild.scss';

export const FirstChild: FC<PropsWithChildren> = ({ children }) => (
    <div className="first-child-container">
        {Children.map(children, (child, idx) =>
            isValidElement(child) ? <div key={`child-${idx}`}>{cloneElement(child)}</div> : child
        )}
    </div>
);

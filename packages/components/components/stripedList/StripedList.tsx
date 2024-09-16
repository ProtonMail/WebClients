import type { ReactNode } from 'react';
import { Children, isValidElement } from 'react';

import clsx from '@proton/utils/clsx';

export interface StripedListProps {
    children: ReactNode;
    alternate?: 'odd' | 'even';
    className?: string;
}

const StripedList = ({ children, alternate = 'even', className }: StripedListProps) => (
    <ul className={clsx(alternate === 'even' ? 'even:bg-weak' : 'odd:bg-weak', 'unstyled', className)}>
        {Children.map(children, (child) => {
            if (isValidElement(child)) {
                return child;
            }
            return null;
        })}
    </ul>
);

export default StripedList;

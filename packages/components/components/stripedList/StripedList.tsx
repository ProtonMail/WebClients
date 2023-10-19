import { Children, ReactNode, isValidElement } from 'react';

import clsx from '@proton/utils/clsx';

interface StripedListProps {
    children: ReactNode;
    alternate?: 'odd' | 'even';
    className?: string;
}

const StripedList = ({ children, alternate = 'even', className }: StripedListProps) => (
    <ul className={clsx(alternate === 'even' ? 'bg-weak-even' : 'bg-weak-odd', 'unstyled', className)}>
        {Children.map(children, (child) => {
            if (isValidElement(child)) {
                return child;
            }
            return null;
        })}
    </ul>
);

export default StripedList;

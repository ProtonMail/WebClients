import { Children, isValidElement, ReactNode } from 'react';
import clsx from '@proton/utils/clsx';

interface StripedListProps {
    children: ReactNode;
    alternate?: 'odd' | 'even';
}

const StripedList = ({ children, alternate = 'even' }: StripedListProps) => (
    <ul className={clsx(alternate === 'even' ? 'bg-weak-even' : 'bg-weak-odd', 'unstyled')}>
        {Children.map(children, (child) => {
            if (isValidElement(child)) {
                return child;
            }
            return null;
        })}
    </ul>
);

export default StripedList;

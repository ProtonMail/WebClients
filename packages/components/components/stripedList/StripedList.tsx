import { Children, isValidElement, ReactNode } from 'react';

interface StripedListProps {
    children: ReactNode;
}

const StripedList = ({ children }: StripedListProps) => (
    <ul className="bg-weak-even unstyled">
        {Children.map(children, (child) => {
            if (isValidElement(child)) {
                return child;
            }
            return null;
        })}
    </ul>
);

export default StripedList;

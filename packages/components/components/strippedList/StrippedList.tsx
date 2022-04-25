import { Children, isValidElement } from 'react';

interface StrippedListProps {
    children: React.ReactNode;
}

const StrippedList = ({ children }: StrippedListProps) => (
    <ul className="bg-weak-even unstyled">
        {Children.map(children, (child) => {
            if (isValidElement(child)) {
                return child;
            }
            return null;
        })}
    </ul>
);

export default StrippedList;

import React, { Children } from 'react';

interface StrippedListProps {
    children: React.ReactNode;
}

const StrippedList = ({ children }: StrippedListProps) => (
    <ul className="bg-weak-even unstyled">
        {Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return (
                    <li className="px1 py0-5">
                        <child.type {...child.props} />
                    </li>
                );
            }
            return null;
        })}
    </ul>
);

export default StrippedList;

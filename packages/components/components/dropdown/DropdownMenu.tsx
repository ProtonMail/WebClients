import React from 'react';
import { classnames } from '../../helpers/component';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const DropdownMenu = ({ children, className = '' }: Props) => {
    return (
        <div className="dropDown-content">
            <ul className={classnames(['unstyled mt0 mb0 ml1 mr1', className])}>
                {React.Children.toArray(children).map((child, i) => {
                    return React.isValidElement(child) ? (
                        <li className="dropDown-item" key={child.key || i}>
                            {child}
                        </li>
                    ) : null;
                })}
            </ul>
        </div>
    );
};

export default DropdownMenu;

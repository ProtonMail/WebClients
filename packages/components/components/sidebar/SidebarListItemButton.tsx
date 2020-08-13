import React from 'react';
import { classnames } from '../../helpers';

export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

const SidebarListItemButton = ({ children, className, ...rest }: Props) => {
    return (
        <button className={classnames(['navigation__link w100 alignleft', className])} {...rest}>
            {children}
        </button>
    );
};

export default SidebarListItemButton;

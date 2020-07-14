import React from 'react';
import { classnames } from '../../helpers/component';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const SidebarListItemDiv = ({ children, className = '', ...rest }: Props) => {
    return (
        <div className={classnames(['navigation__link', className])} {...rest}>
            {children}
        </div>
    );
};

export default SidebarListItemDiv;

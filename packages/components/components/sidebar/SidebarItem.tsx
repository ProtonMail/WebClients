import React, { ReactNode, LiHTMLAttributes } from 'react';

import { classnames } from '../../helpers/component';

interface Props extends LiHTMLAttributes<HTMLLIElement> {
    className?: string;
    itemClassName?: string;
    children?: ReactNode;
}

const SidebarItem = ({ className = '', itemClassName = 'navigation__item', children, ...rest }: Props) => {
    return (
        <li className={classnames([itemClassName, className])} {...rest}>
            {children}
        </li>
    );
};

export default SidebarItem;

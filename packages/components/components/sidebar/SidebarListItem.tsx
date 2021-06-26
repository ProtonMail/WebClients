import React, { ReactNode, LiHTMLAttributes } from 'react';

import { classnames } from '../../helpers';

interface Props extends LiHTMLAttributes<HTMLLIElement> {
    className?: string;
    itemClassName?: string;
    children?: ReactNode;
}

const SidebarListItem = ({ className = '', itemClassName = 'navigation-item', children, ...rest }: Props) => {
    return (
        <li className={classnames([itemClassName, className])} {...rest}>
            {children}
        </li>
    );
};

export const SubSidebarListItem = (props: Props) => {
    return <SidebarListItem itemClassName="navigation-subitem" {...props} />;
};

export default SidebarListItem;

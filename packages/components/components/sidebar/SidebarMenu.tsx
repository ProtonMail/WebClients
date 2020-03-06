import React, { ReactNode } from 'react';
import { classnames } from '../../helpers/component';

interface Props {
    ariaHidden?: boolean;
    listClassName?: string;
    className?: string;
    children?: ReactNode;
}

const SidebarMenu = ({ className, listClassName = 'navigation__list', ariaHidden, children }: Props) => {
    return (
        <ul className={classnames(['unstyled', listClassName, className])} aria-hidden={ariaHidden}>
            {children}
        </ul>
    );
};

export default SidebarMenu;

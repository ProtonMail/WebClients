import type { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLUListElement> {
    listClassName?: string;
    className?: string;
    children?: ReactNode;
}

const SidebarList = ({ className, listClassName = 'navigation-list', children, ...rest }: Props) => {
    return (
        <ul className={clsx('unstyled my-0', listClassName, className)} {...rest}>
            {children}
        </ul>
    );
};

export default SidebarList;

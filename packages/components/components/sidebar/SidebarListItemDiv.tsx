import type { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

const SidebarListItemDiv = ({ children, className = '', ...rest }: Props) => {
    return (
        <div className={clsx(['navigation-link', className])} {...rest}>
            {children}
        </div>
    );
};

export default SidebarListItemDiv;

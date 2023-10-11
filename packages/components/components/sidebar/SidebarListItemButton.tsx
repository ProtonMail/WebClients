import { ButtonHTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

const SidebarListItemButton = ({ children, className, ...rest }: Props) => {
    return (
        <button className={clsx(['navigation-link w-full text-left', className])} type="button" {...rest}>
            {children}
        </button>
    );
};

export default SidebarListItemButton;

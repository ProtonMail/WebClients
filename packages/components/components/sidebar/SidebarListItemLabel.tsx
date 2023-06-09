import { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

export interface Props extends HTMLAttributes<HTMLLabelElement> {
    children: ReactNode;
    htmlFor: string;
}

const SidebarListItemLabel = ({ children, className = '', htmlFor, ...rest }: Props) => {
    return (
        <label htmlFor={htmlFor} className={clsx(['navigation-link', className])} {...rest}>
            {children}
        </label>
    );
};

export default SidebarListItemLabel;

import { HTMLAttributes, ReactNode } from 'react';

import { classnames } from '../../helpers';

export interface Props extends HTMLAttributes<HTMLLabelElement> {
    children: ReactNode;
    htmlFor: string;
}

const SidebarListItemLabel = ({ children, className = '', htmlFor, ...rest }: Props) => {
    return (
        <label htmlFor={htmlFor} className={classnames(['navigation-link', className])} {...rest}>
            {children}
        </label>
    );
};

export default SidebarListItemLabel;

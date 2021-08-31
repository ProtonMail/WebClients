import { HTMLAttributes, ReactNode } from 'react';
import { classnames } from '../../helpers';

export interface Props extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

const SidebarListItemDiv = ({ children, className = '', ...rest }: Props) => {
    return (
        <div className={classnames(['navigation-link', className])} {...rest}>
            {children}
        </div>
    );
};

export default SidebarListItemDiv;

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { classnames } from '../../helpers';

export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

const SidebarListItemButton = ({ children, className, ...rest }: Props) => {
    return (
        <button className={classnames(['navigation-link w100 text-left', className])} type="button" {...rest}>
            {children}
        </button>
    );
};

export default SidebarListItemButton;

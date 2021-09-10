import { ButtonHTMLAttributes, ReactNode } from 'react';
import { classnames } from '../../helpers';

export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    onFocus: () => void;
}

const SidebarListItemButton = ({ children, className, onFocus, ...rest }: Props) => {
    return (
        <button
            onFocus={onFocus}
            className={classnames(['navigation-link w100 text-left', className])}
            type="button"
            {...rest}
        >
            {children}
        </button>
    );
};

export default SidebarListItemButton;

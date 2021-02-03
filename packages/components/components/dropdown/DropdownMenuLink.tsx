import React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.HTMLAttributes<HTMLAnchorElement> {
    className?: string;
    children?: React.ReactNode;
    href?: string;
    target?: string;
}

const DropdownMenuLink = ({ className = '', children, target = '_blank', ...rest }: Props) => {
    return (
        <a
            className={classnames(['dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration', className])}
            rel="noopener noreferrer"
            target={target}
            {...rest}
        >
            {children}
        </a>
    );
};

export default DropdownMenuLink;

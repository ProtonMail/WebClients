import React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.HTMLAttributes<HTMLAnchorElement> {
    className?: string;
    children?: React.ReactNode;
    href?: string;
    target?: string;
}

const DropdownMenuLink = ({ className = '', children, ...rest }: Props) => {
    return (
        <a
            className={classnames(['dropDown-item-link w100 pr1 pl1 pt0-5 pb0-5 bl nodecoration', className])}
            rel="noopener noreferrer"
            {...rest}
        >
            {children}
        </a>
    );
};

export default DropdownMenuLink;

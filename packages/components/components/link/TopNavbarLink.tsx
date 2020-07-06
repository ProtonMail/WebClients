import React from 'react';

import { Icon } from '../../index';
import Link, { Props as LinkProps } from './Link';

export interface Props extends LinkProps {
    text: string;
    icon: string;
}

const TopNavbarLink = ({ icon, text, ...rest }: Props) => {
    return (
        <Link {...rest}>
            <Icon className="topnav-icon mr0-5 flex-item-centered-vert" name={icon} />
            <span className="navigation-title topnav-linkText">{text}</span>
        </Link>
    );
};

export default TopNavbarLink;

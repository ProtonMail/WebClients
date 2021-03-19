import React from 'react';

import { Icon } from '../icon';
import AppLink, { Props as LinkProps } from './AppLink';

export interface Props extends LinkProps {
    text: string;
    icon: string;
}

const TopNavbarLink = ({ icon, text, ...rest }: Props) => {
    return (
        <AppLink className="topnav-link inline-flex flex-align-items-center" title={text} {...rest}>
            <Icon className="topnav-icon mr0-5" name={icon} />
            <span className="navigation-title">{text}</span>
        </AppLink>
    );
};

export default TopNavbarLink;

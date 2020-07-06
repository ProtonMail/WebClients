import React from 'react';
import { Icon, Link } from '../../index';

interface Props {
    icon: string;
    to: string;
    external: boolean;
    current: boolean;
}
const MobileNavLink = ({ icon = '', to = '', external = false, current = false }: Props) => {
    return (
        <Link to={to} external={external} aria-current={current} className="flex aside-link">
            <Icon name={icon} className="aside-linkIcon mauto" />
        </Link>
    );
};

export default MobileNavLink;

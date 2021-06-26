import React from 'react';
import AppLink, { Props as AppLinkProps } from '../link/AppLink';
import Icon from '../icon/Icon';

interface Props extends AppLinkProps {
    icon: string;
    current: boolean;
}
const MobileNavLink = ({ icon = '', current = false, ...rest }: Props) => {
    return (
        <AppLink aria-current={current} className="flex aside-link" {...rest}>
            <Icon name={icon} className="aside-link-icon mauto" />
        </AppLink>
    );
};

export default MobileNavLink;

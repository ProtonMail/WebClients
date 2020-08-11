import { c } from 'ttag';
import React from 'react';
import TopNavbarLink, { Props as TopNavbarLinkProps } from '../../components/link/TopNavbarLink';

const SettingsButton = (props: Omit<TopNavbarLinkProps, 'icon' | 'text'>) => {
    return (
        <TopNavbarLink
            data-test-id="view:general-settings"
            {...props}
            icon="settings-master"
            text={c('Title').t`Settings`}
        />
    )
}

export default SettingsButton;

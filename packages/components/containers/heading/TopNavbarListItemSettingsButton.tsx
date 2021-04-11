import { c } from 'ttag';
import React from 'react';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';
import Icon from '../../components/icon/Icon';
import AppLink from '../../components/link/AppLink';

const TopNavbarListItemSettingsButton = (
    props: Omit<TopNavbarListItemButtonProps<typeof AppLink>, 'icon' | 'text' | 'as'>
) => {
    return (
        <TopNavbarListItemButton
            data-test-id="view:general-settings"
            target="_self"
            {...props}
            as={AppLink}
            icon={<Icon name="settings-master" />}
            text={c('Title').t`Settings`}
        />
    );
};

export default TopNavbarListItemSettingsButton;

import React from 'react';
import { c } from 'ttag';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import TopNavbarLink, { Props } from '../../components/link/TopNavbarLink';

const UpgradeButton = (props: Omit<Props, 'text' | 'icon' | 'to'>) => {
    return (
        <TopNavbarLink
            {...props}
            text={c('Link').t`Upgrade`}
            icon="upgrade-to-paid"
            to="/subscription"
            toApp={getAccountSettingsApp()}
            title={c('Link').t`Upgrade`}
        />
    );
};

export default UpgradeButton;

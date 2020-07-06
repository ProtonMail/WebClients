import React from 'react';
import { c } from 'ttag';

import TopNavbarLink, { Props } from '../../components/link/TopNavbarLink';

const UpgradeButton = (props: Omit<Props, 'text' | 'icon' | 'to'>) => {
    return <TopNavbarLink {...props} text={c('Link').t`Upgrade`} icon="upgrade-to-paid" to="/settings/subscription" />;
};

export default UpgradeButton;

import type { FC } from 'react';

import { c } from 'ttag';

import { UpsellRef } from '../../../constants';
import { UpgradeButton } from '../../Upsell/UpgradeButton';

export const AccessUpgrade: FC = () => (
    <UpgradeButton
        inline
        label={c('Action').t`Upgrade now to share with more people`}
        upsellRef={UpsellRef.LIMIT_SHARING}
        key="access-upgrade-link"
    />
);

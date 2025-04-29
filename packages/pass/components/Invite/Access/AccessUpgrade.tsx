import type { FC } from 'react';

import { c } from 'ttag';

import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';

export const AccessUpgrade: FC = () => (
    <UpgradeButton
        inline
        label={c('Action').t`Upgrade now to share with more people`}
        upsellRef={UpsellRef.LIMIT_SHARING}
        key="access-upgrade-link"
    />
);

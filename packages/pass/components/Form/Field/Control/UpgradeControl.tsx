import type { FC } from 'react';

import type { IconName } from '@proton/icons/types';

import type { UpsellRef } from '../../../../constants';
import { UpgradeButton } from '../../../Upsell/UpgradeButton';
import { ValueControl } from './ValueControl';

type UpgradeControlProps = {
    icon?: IconName;
    label: string;
    upsellRef: UpsellRef;
};

export const UpgradeControl: FC<UpgradeControlProps> = ({ icon, label, upsellRef }) => (
    <ValueControl icon={icon} label={label}>
        <UpgradeButton inline upsellRef={upsellRef} />
    </ValueControl>
);

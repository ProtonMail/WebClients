import type { FC } from 'react';

import type { IconComponent } from '@proton/icons/component';

import type { UpsellRef } from '../../../../constants';
import { UpgradeButton } from '../../../Upsell/UpgradeButton';
import { ValueControl } from './ValueControl';

type UpgradeControlProps = {
    icon?: IconComponent;
    label: string;
    upsellRef: UpsellRef;
};

export const UpgradeControl: FC<UpgradeControlProps> = ({ icon, label, upsellRef }) => (
    <ValueControl icon={icon} label={label}>
        <UpgradeButton inline upsellRef={upsellRef} />
    </ValueControl>
);

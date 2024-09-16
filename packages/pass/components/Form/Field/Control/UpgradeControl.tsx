import { type FC } from 'react';

import { type IconName } from '@proton/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { type UpsellRef } from '@proton/pass/constants';

import { ValueControl } from './ValueControl';

type UpgradeControlProps = {
    icon: IconName;
    label: string;
    upsellRef: UpsellRef;
};

export const UpgradeControl: FC<UpgradeControlProps> = ({ icon, label, upsellRef }) => (
    <ValueControl icon={icon} label={label}>
        <UpgradeButton inline upsellRef={upsellRef} />
    </ValueControl>
);

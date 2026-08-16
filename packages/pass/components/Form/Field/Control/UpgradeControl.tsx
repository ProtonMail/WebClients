import type { FC, ReactElement } from 'react';

import type { IconName } from '@proton/icons/types';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import type { UpsellRef } from '@proton/pass/constants';

import { ValueControl } from './ValueControl';

type UpgradeControlProps = {
    icon?: IconName | ReactElement;
    label: string;
    upsellRef: UpsellRef;
};

export const UpgradeControl: FC<UpgradeControlProps> = ({ icon, label, upsellRef }) => (
    <ValueControl icon={icon} label={label}>
        <UpgradeButton inline upsellRef={upsellRef} />
    </ValueControl>
);

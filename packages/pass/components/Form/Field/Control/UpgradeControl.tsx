import { type VFC } from 'react';

import { type IconName } from '@proton/components/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';

import { ValueControl } from './ValueControl';

type UpgradeControlProps = {
    icon: IconName;
    label: string;
};

export const UpgradeControl: VFC<UpgradeControlProps> = ({ icon, label }) => (
    <ValueControl icon={icon} label={label}>
        <UpgradeButton inline />
    </ValueControl>
);

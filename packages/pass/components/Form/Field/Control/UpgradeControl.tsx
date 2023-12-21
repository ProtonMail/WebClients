import { type VFC } from 'react';

import { type IconName } from '@proton/components/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';

import { PASS_EOY_PATH, PASS_UPGRADE_PATH } from '@proton/pass/constants';
import { isEOY } from '@proton/pass/lib/onboarding/utils';
import { ValueControl } from './ValueControl';

type UpgradeControlProps = {
    icon: IconName;
    label: string;
    ref: string;
};

export const UpgradeControl: VFC<UpgradeControlProps> = ({ icon, label, ref }) => (
    <ValueControl icon={icon} label={label}>
        <UpgradeButton inline ref={ref} path={isEOY() ? PASS_EOY_PATH : PASS_UPGRADE_PATH} />
    </ValueControl>
);

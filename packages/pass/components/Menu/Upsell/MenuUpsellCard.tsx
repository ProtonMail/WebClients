import type { FC } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { UpsellRef } from '../../../constants';
import { Card } from '../../Layout/Card/Card';
import { UpgradeButton } from '../../Upsell/UpgradeButton';

type Props = { className?: string };

/** Softer alternative to the full-width upgrade button: leads with what Pass
 * Plus gives, with the CTA as a secondary element. Rendered when the
 * `PassLessAggressiveUpsell` feature flag is enabled - in the dropdown menu
 * via `MenuUser`, and in the sidebar layout via `SidebarUpsell`. */
export const MenuUpsellCard: FC<Props> = ({ className }) => (
    <Card className={clsx('flex items-center justify-space-between flex-nowrap gap-3 p-3', className)}>
        <div className="text-left">
            <div className="text-semibold text-ellipsis">{c('Title').t`Unlock Pass Plus`}</div>
            <div className="text-sm color-weak">{c('Info').t`Unlimited aliases, 2FA, dark web monitor`}</div>
        </div>
        <UpgradeButton buttonSize="small" upsellRef={UpsellRef.MENU} />
    </Card>
);

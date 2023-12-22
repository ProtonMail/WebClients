import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { isEOY } from '@proton/pass/lib/onboarding/upselling';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

import './BottonBar.scss';

export const BottomBar: FC = () => {
    const passPlan = useSelector(selectPassPlan);

    if (passPlan === UserPassPlan.PLUS || !isEOY()) {
        return null;
    }

    return (
        <div className="pass-bottom-bar flex items-center justify-center flex-nowrap w-full p-3 ui-violet">
            <div className="text-center text-sm">
                {c('Info')
                    .t`Pass Plus for 1.99$/m instead of $3.99/m until Dec 31, including early access to the web app. `}
                <UpgradeButton upsellRef={UpsellRef.EOY_2023} label="Upgrade now" inline />
            </div>
        </div>
    );
};

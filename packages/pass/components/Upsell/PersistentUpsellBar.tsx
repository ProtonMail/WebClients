import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { PASS_EOY_MONTHLY_PRICE, UpsellRef } from '@proton/pass/constants';
import { isEOY } from '@proton/pass/lib/onboarding/upselling';
import { selectPassPlan, selectUser } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

import './PersistentUpsellBar.scss';

export const PersistentUpsellBar: FC = () => {
    const passPlan = useSelector(selectPassPlan);
    const user = useSelector(selectUser);
    if (passPlan === UserPassPlan.PLUS || !isEOY()) return null;

    const eoyRelativePrice = getSimplePriceString(user!.Currency, PASS_EOY_MONTHLY_PRICE, '');

    return (
        <div className="pass-bottom-bar flex items-center justify-center flex-nowrap w-full p-2 color-norm">
            <div className="flex gap-2 items-center text-center text-xs">
                <span className="text-rg">
                    <Pill
                        className="text-uppercase text-semibold border border-weak"
                        backgroundColor="--interaction-weak-major-1"
                        color="var(--text-norm)"
                    >
                        {c('Badge').t`Limited time`}
                    </Pill>
                </span>
                <span className="text-semibold">{c('Info')
                    .t`Pass Plus for ${eoyRelativePrice}/m, including early access to the web app.`}</span>
                <UpgradeButton
                    upsellRef={UpsellRef.EOY_2023}
                    buttonSize="small"
                    iconSize={12}
                    className="max-h-custom"
                    style={{ '--max-h-custom': '1.9em' }}
                />
            </div>
        </div>
    );
};

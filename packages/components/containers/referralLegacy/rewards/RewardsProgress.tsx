import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import Meter from '@proton/components/components/progress/Meter';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments';

interface Props {
    rewards: number;
    rewardsLimit: number;
}

const RewardsProgress = ({ rewards, rewardsLimit }: Props) => {
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    if (plansMapLoading) {
        return null;
    }

    const mailPlusPlan = plansMap[PLANS.MAIL];
    if (!mailPlusPlan) {
        return null;
    }

    const price = Math.round((mailPlusPlan.Pricing[CYCLE.MONTHLY] || 0) / 100) * 100; // Price rounded to 500
    const current = getSimplePriceString(mailPlusPlan.Currency, rewards * price);
    const total = getSimplePriceString(mailPlusPlan.Currency, rewardsLimit * price);

    return (
        <div className="flex justify-space-between items-stretch lg:items-center gap-4 flex-column lg:flex-row">
            <div className="lg:flex-1">
                <b>{c('Info').t`Credits earned`}</b>
            </div>
            <div className="lg:flex-1">{rewards > 0 && <Meter value={rewards} max={rewardsLimit} />}</div>
            <div className="lg:flex-1 text-right">{
                // translator: Full sentence can be something like this : "$30 of $90"
                c('Info').t`${current} of ${total}`
            }</div>
        </div>
    );
};

export default RewardsProgress;

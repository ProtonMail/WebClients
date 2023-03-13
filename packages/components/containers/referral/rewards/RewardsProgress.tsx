import { c } from 'ttag';

import { Meter, usePlans, useUser } from '@proton/components';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import { humanPriceWithCurrency } from '@proton/shared/lib/helpers/humanPrice';

interface Props {
    rewards: number;
    rewardsLimit: number;
}

const RewardsProgress = ({ rewards, rewardsLimit }: Props) => {
    const [user] = useUser();
    const [plans = []] = usePlans();
    
    const mailPlusPlan = plans.find(({ Name }) => Name === PLANS.MAIL);
    const price = Math.round((mailPlusPlan?.Pricing[CYCLE.MONTHLY] || 0) / 100) * 100; // Price rounded to 500
    const current = humanPriceWithCurrency(rewards * price, user.Currency);
    const total = humanPriceWithCurrency(rewardsLimit * price, user.Currency);

    return (
        <div className="flex flex-justify-space-between flex-align-items-center flex-gap-1 on-tablet-flex-column">
            <div className="flex-item-fluid">
                <b>{c('Info').t`Credits earned`}</b>
            </div>
            <div className="flex-item-fluid">{rewards > 0 && <Meter value={rewards} max={rewardsLimit} />}</div>
            <div className="flex-item-fluid text-right">{
                // translator: Full sentence can be something like this : "$30 of $90"
                c('Info').t`${current} of ${total}`
            }</div>
        </div>
    );
};

export default RewardsProgress;

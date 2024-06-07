import { c } from 'ttag';

import { Price } from '@proton/components/components';
import { CYCLE } from '@proton/shared/lib/constants';
import { SubscriptionPlan } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: SubscriptionPlan[];
}

const AssistantSubscriptionPrice = ({ subscription }: Props) => {
    if (!subscription) {
        return null;
    }

    const { Cycle, Currency } = subscription[0];
    const amount = subscription.reduce((acc, curr) => {
        return acc + curr.Amount;
    }, 0);

    const price = (
        <Price currency={Currency} isDisplayedInSentence>
            {amount}
        </Price>
    );

    if (Cycle === CYCLE.YEARLY) {
        return <p className="m-0">{c('Assistant toggle').jt`${price} /year`}</p>;
    }

    if (Cycle === CYCLE.MONTHLY || Cycle) {
        const monthlyPrice = (
            <Price currency={Currency} isDisplayedInSentence>
                {amount / Cycle}
            </Price>
        );

        const localPrice = Cycle === CYCLE.MONTHLY ? price : monthlyPrice;
        return <p className="m-0">{c('Assistant toggle').jt`${localPrice} /month`}</p>;
    }

    return null;
};

export default AssistantSubscriptionPrice;

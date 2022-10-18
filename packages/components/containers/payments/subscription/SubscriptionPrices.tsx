import { c } from 'ttag';

import { CYCLE } from '@proton/shared/lib/constants';
import { Currency, Cycle, Plan } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { Price } from '../../../components';

interface Props {
    cycle: Cycle;
    currency: Currency;
    plan?: Plan;
    suffix?: string;
}

const SubscriptionPrices = ({ cycle, currency, plan = FREE_PLAN, suffix = c('Suffix').t`per month` }: Props) => {
    const pricingPerCycle = plan?.Pricing[cycle] || 0;
    const billedAmount = (
        <Price key="billed-amount" currency={currency}>
            {pricingPerCycle}
        </Price>
    );
    return (
        <>
            <Price
                currency={currency}
                className="subscriptionPrices-monthly inline-flex flex-justify-center"
                suffix={suffix}
            >
                {pricingPerCycle / cycle}
            </Price>
            {cycle === CYCLE.YEARLY && (
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billedAmount} per year`}</div>
            )}
            {cycle === CYCLE.TWO_YEARS && (
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billedAmount} every 2 years`}</div>
            )}
            {cycle === CYCLE.THIRTY && (
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billedAmount} every 30 months`}</div>
            )}
            {cycle === CYCLE.FIFTEEN && (
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billedAmount} every 15 months`}</div>
            )}
        </>
    );
};

export default SubscriptionPrices;

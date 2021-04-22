import React from 'react';
import { CYCLE } from 'proton-shared/lib/constants';
import { Currency, Cycle, Plan } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';
import { FREE_MAIL_PLAN } from 'proton-shared/lib/subscription/freePlans';

import { Price } from '../../../components';

interface Props {
    cycle: Cycle;
    currency: Currency;
    plan?: Plan;
    suffix?: string;
}

const SubscriptionPrices = ({ cycle, currency, plan = FREE_MAIL_PLAN, suffix = c('Suffix').t`/month` }: Props) => {
    const billedAmount = (
        <Price key="billed-amount" currency={currency}>
            {plan.Pricing[cycle]}
        </Price>
    );
    return (
        <>
            <Price
                currency={currency}
                className="subscriptionPrices-monthly inline-flex flex-justify-center"
                suffix={suffix}
            >
                {plan.Pricing[cycle] / cycle}
            </Price>
            {cycle === CYCLE.YEARLY && (
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billedAmount} per year`}</div>
            )}
            {cycle === CYCLE.TWO_YEARS && (
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billedAmount} every 2 years`}</div>
            )}
        </>
    );
};

export default SubscriptionPrices;

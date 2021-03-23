import React from 'react';
import { CYCLE } from 'proton-shared/lib/constants';
import { Currency, Cycle, Plan } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';
import { Price } from '../../../components';

const FREE_PLAN = {
    Pricing: {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.TWO_YEARS]: 0,
    },
} as Plan;

interface Props {
    cycle: Cycle;
    currency: Currency;
    plan?: Plan;
    suffix?: string;
}

const SubscriptionPrices = ({ cycle, currency, plan = FREE_PLAN, suffix = c('Suffix').t`/month` }: Props) => {
    const billiedAmount = (
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
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billiedAmount} per year`}</div>
            )}
            {cycle === CYCLE.TWO_YEARS && (
                <div className="text-sm mt0 mb0">{c('Details').jt`Billed as ${billiedAmount} every 2 years`}</div>
            )}
        </>
    );
};

export default SubscriptionPrices;

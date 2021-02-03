import React from 'react';
import PropTypes from 'prop-types';
import { CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { Price } from '../../../components';

const FREE_PLAN = {
    Pricing: {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.TWO_YEARS]: 0,
    },
};

const SubscriptionPrices = ({ cycle, currency, plan = FREE_PLAN, suffix = c('Suffix').t`/month` }) => {
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

SubscriptionPrices.propTypes = {
    suffix: PropTypes.string,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
    plan: PropTypes.shape({
        Pricing: PropTypes.object,
    }),
};

export default SubscriptionPrices;

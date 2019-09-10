import React from 'react';
import PropTypes from 'prop-types';
import { CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { Price } from 'react-components';

const PriceInfo = ({ plan, cycle, currency }) => {
    const billingCycleI18n = {
        [CYCLE.MONTHLY]: {
            label: c('Label').t`1 month`,
            total: c('Label').t`Total price`
        },
        [CYCLE.YEARLY]: {
            label: c('Label').t`12 months`,
            discount: c('Label').t`Annual discount (20%)`,
            total: c('Label').t`Total price (annually)`
        },
        [CYCLE.TWO_YEARS]: {
            label: c('Label').t`24 months`,
            discount: c('Label').t`Two-year discount (33%)`,
            total: c('Label').t`Total price (two-year)`
        }
    };

    const billingCycle = billingCycleI18n[cycle];
    const discount = plan.couponDiscount || plan.price.saved;

    return (
        <>
            {plan.price.monthly > 0 && (
                <div className="flex flex-spacebetween">
                    <span className="mr0-25">
                        {plan.title} - {billingCycle.label}
                    </span>
                    <Price currency={currency}>{plan.price.monthly * cycle}</Price>
                </div>
            )}
            {(plan.couponDiscount || billingCycle.discount) && (
                <div className="flex color-global-success flex-spacebetween">
                    <span className="mr0-25">
                        {plan.couponDiscount ? plan.couponDescription : billingCycle.discount}
                    </span>
                    <Price currency={currency}>{-discount}</Price>
                </div>
            )}
            <strong className="flex flex-spacebetween">
                <span className="mr0-25">{billingCycle.total}</span>
                <Price currency={currency}>{plan.price.total}</Price>
            </strong>
        </>
    );
};

PriceInfo.propTypes = {
    plan: PropTypes.object.isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired
};

export default PriceInfo;

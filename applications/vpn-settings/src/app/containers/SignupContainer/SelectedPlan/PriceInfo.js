import React from 'react';
import PropTypes from 'prop-types';
import { CYCLE, CURRENCIES } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Price } from '@proton/components';

const PriceInfo = ({ plan, cycle, currency }) => {
    const baseTotal = plan.price.monthly * cycle;
    const discount = plan.couponDiscount || plan.price.saved;
    const discountPercentage = Math.floor((discount * 100) / baseTotal);

    const billingCycleI18n = {
        [CYCLE.MONTHLY]: {
            label: c('Label').t`1 month`,
            total: c('Label').t`Total price`,
        },
        [CYCLE.YEARLY]: {
            label: c('Label').t`12 months`,
            discount: c('Label').t`Annual discount (${discountPercentage}%)`,
            total: c('Label').t`Total price (annually)`,
        },
        [CYCLE.TWO_YEARS]: {
            label: c('Label').t`24 months`,
            discount: c('Label').t`Two-year discount (${discountPercentage}%)`,
            total: c('Label').t`Total price (two-year)`,
        },
    }[cycle];

    return (
        <>
            {plan.price.monthly > 0 && (
                <div className="flex flex-justify-space-between">
                    <span className="mr0-25">
                        {plan.title} - {billingCycleI18n.label}
                    </span>
                    <Price currency={currency}>{baseTotal}</Price>
                </div>
            )}
            {(plan.couponDiscount || billingCycleI18n.discount) && (
                <div className="flex color-success flex-justify-space-between">
                    <span className="mr0-25">
                        {plan.couponDiscount
                            ? `${plan.couponDescription} (${discountPercentage}%)`
                            : billingCycleI18n.discount}
                    </span>
                    <Price currency={currency}>{-discount}</Price>
                </div>
            )}
            <strong className="flex flex-justify-space-between">
                <span className="mr0-25">{billingCycleI18n.total}</span>
                <Price currency={currency}>{plan.price.total}</Price>
            </strong>
        </>
    );
};

PriceInfo.propTypes = {
    plan: PropTypes.object.isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
};

export default PriceInfo;

import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Price } from 'react-components';
import { CYCLE, CURRENCIES } from 'proton-shared/lib/constants';

const PlanPrice = ({ plan, cycle, currency }) => {
    const discount = plan.couponDiscount || plan.price.saved;
    const totalMonthlyPriceText = (
        <span key="total-monthly" className="plan-price-area">
            <Price className="inline-flex" currency={currency}>
                {plan.price.totalMonthly}
            </Price>
        </span>
    );
    const totalBilledText =
        cycle === CYCLE.MONTHLY ? (
            <Price key="billed-price" currency={currency} suffix={c('Suffix').t`monthly`}>
                {plan.price.totalMonthly}
            </Price>
        ) : (
            <Price
                key="billed-price"
                currency={currency}
                suffix={cycle === CYCLE.TWO_YEARS ? c('Suffix').t`/2-year` : c('Suffix').t`/year`}
            >
                {plan.price.total}
            </Price>
        );
    const discountText = (
        <Price key="discount" currency={currency}>
            {discount}
        </Price>
    );
    return (
        <div className="border-top pt1 plan-price">
            <div className="mb0-5">{c('PlanPrice').jt`${totalMonthlyPriceText} / mo`}</div>

            <div>
                <div className="opacity-50">{c('PlanPrice').jt`Billed as ${totalBilledText}`}</div>
                {discount > 0 && <div className="bold color-primary">{c('PlanPrice').jt`SAVE ${discountText}`}</div>}
            </div>
        </div>
    );
};

PlanPrice.propTypes = {
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
    plan: PropTypes.shape({
        couponDiscount: PropTypes.number,
        price: PropTypes.shape({
            totalMonthly: PropTypes.number,
            monthly: PropTypes.number,
            total: PropTypes.number,
            saved: PropTypes.number
        }).isRequired
    }).isRequired
};

export default PlanPrice;

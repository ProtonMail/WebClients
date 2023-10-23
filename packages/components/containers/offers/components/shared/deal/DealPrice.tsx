import { c } from 'ttag';

import { Price } from '@proton/components/components';

import { useDealContext } from '../deal/DealContext';

const DealPrice = () => {
    const {
        deal: { prices, cycle },
        currency,
    } = useDealContext();
    const { withCoupon = 0, withoutCouponMonthly = 0 } = prices || {};

    return (
        <div className="my-4 text-center">
            <Price
                currency={currency}
                className="offer-monthly-price color-norm"
                suffix={c('specialoffer: Offers').t`/ month`}
                isDisplayedInSentence
            >
                {withCoupon / cycle}
            </Price>
            <Price
                className="text-strike color-weak offer-regular-price relative"
                currency={currency}
                suffix={c('specialoffer: Offers').t`/ month`}
            >
                {withoutCouponMonthly}
            </Price>
        </div>
    );
};

export default DealPrice;

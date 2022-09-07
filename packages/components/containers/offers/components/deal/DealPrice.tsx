import { c } from 'ttag';

import { Price } from '@proton/components/components';

import { useDealContext } from '../deal/DealContext';

const DealPrice = () => {
    const {
        deal: { prices, cycle },
        currency,
    } = useDealContext();
    const { withCoupon = 0 } = prices || {};

    return (
        <div className="mb1 mt1 text-center">
            <Price
                currency={currency}
                className="offer-monthly-price color-norm"
                suffix={c('specialoffer: Offers').t`/ month`}
                isDisplayedInSentence
            >
                {withCoupon / cycle}
            </Price>
        </div>
    );
};

export default DealPrice;

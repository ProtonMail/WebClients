import { c } from 'ttag';

import { Price } from '@proton/components/components';

import { getDealBilledDescription } from './Deal.helpers';
import { useDealContext } from './DealContext';

const DealPriceInfos = () => {
    const {
        deal: { cycle, prices },
        currency,
    } = useDealContext();
    const { withCoupon = 0, withoutCouponMonthly = 0 } = prices || {};

    const amountDue = (
        <Price key={'deal-amount'} currency={currency} isDisplayedInSentence>
            {withCoupon}
        </Price>
    );

    const regularPrice = (
        <span className="text-strike" key={'deal-regular-price'}>
            <Price currency={currency}>{withoutCouponMonthly * cycle}</Price>
        </span>
    );

    return (
        <div className="mb0-5 w100">
            <small className="w100 color-weak text-left">
                <span className="block">{getDealBilledDescription(cycle, amountDue)}</span>
                <span className="block">{c('specialoffer: Offers').jt`Standard price ${regularPrice}`}</span>
            </small>
        </div>
    );
};

export default DealPriceInfos;

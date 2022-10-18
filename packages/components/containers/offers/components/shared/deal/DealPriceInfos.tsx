import { c } from 'ttag';

import { Price } from '@proton/components/components';

import { useDealContext } from './DealContext';

const DealPriceInfos = () => {
    const {
        deal: { cycle, prices, star },
        currency,
    } = useDealContext();
    const { withCoupon = 0, withoutCouponMonthly = 0 } = prices || {};

    const amountDue = (
        <Price key="deal-amount" currency={currency} isDisplayedInSentence>
            {withCoupon}
        </Price>
    );

    const regularPrice = (
        <span key="deal-regular-price">
            <Price currency={currency}>{withoutCouponMonthly * cycle}</Price>
        </span>
    );

    return (
        <div className="mb0-5 w100">
            <small className="w100 color-weak text-left">
                <span className="block">
                    {c('specialoffer: Offers').jt`Billed at ${amountDue}`} {star ? <sup>{star}</sup> : null}
                </span>
                <span className="block">{c('specialoffer: Offers').jt`Standard price ${regularPrice}`}</span>
            </small>
        </div>
    );
};

export default DealPriceInfos;

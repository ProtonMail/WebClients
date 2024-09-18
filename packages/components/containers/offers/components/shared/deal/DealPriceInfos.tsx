import Price from '@proton/components/components/price/Price';

import { getDealBilledDescription } from '../../../helpers/offerCopies';
import { useDealContext } from './DealContext';

const DealPriceInfos = () => {
    const {
        deal: { cycle, prices, star },
        currency,
    } = useDealContext();
    const { withCoupon = 0 } = prices || {};

    const amountDue = (
        <Price key="deal-amount" currency={currency} isDisplayedInSentence>
            {withCoupon}
        </Price>
    );

    // const regularPrice = (
    //     <span key="deal-regular-price">
    //         <Price currency={currency}>{withoutCouponMonthly * cycle}</Price>
    //     </span>
    // );

    return (
        <div className="w-full">
            <small className="w-full color-weak text-left">
                <span className="block">
                    {getDealBilledDescription(cycle, amountDue)} {star ? <sup>{star}</sup> : null}
                </span>
                {/* <span className="block">{getStandardPriceDescription(cycle, regularPrice)}</span> */}
            </small>
        </div>
    );
};

export default DealPriceInfos;

import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import { getDealMonthDurationText } from '../../helpers/offerCopies';
import type { OfferProps } from '../../interface';

const Anniversary2025Pricing = (props: OfferProps) => {
    const {
        dealName,
        prices: { withCoupon = 0, withoutCouponMonthly = 0 },
        cycle,
    } = props.offer.deals[0];

    const durationDeal = getDealMonthDurationText(cycle);
    const fullPrice = withoutCouponMonthly * cycle;
    const salePercentage = Math.round(((fullPrice - withCoupon) * 100) / fullPrice);

    return (
        <>
            <div className="flex flex-row items-center mb-4">
                <div className="flex-1">
                    <p className="block text-4xl m-0 text-bold">{dealName}</p>
                    <p className="color-weak m-0 block">{c('anniversary_2025: Offers').t`for ${durationDeal}`}</p>
                </div>
                <span className="anniversary-2025-price-off ratio-square border border-norm text-bold p-2 shrink-0 flex">
                    <span className="m-auto">
                        <span className="block">{`${salePercentage}%`}</span>
                        <span className="block">OFF</span>
                    </span>
                </span>
            </div>
            <div className="mb-4">
                <div>
                    <Price currency={props.currency} className="anniversary-2025-price text-bold" isDisplayedInSentence>
                        {withCoupon / cycle}
                    </Price>
                    <span className="m-0 text-lg">{c('anniversary_2025: Offers').t`/ month`}</span>
                </div>
                <Price
                    className="text-strike color-weak offer-regular-price relative"
                    currency={props.currency}
                    suffix={c('anniversary_2025: Offers').t`/ month`}
                >
                    {withoutCouponMonthly}
                </Price>
            </div>
        </>
    );
};

export default Anniversary2025Pricing;

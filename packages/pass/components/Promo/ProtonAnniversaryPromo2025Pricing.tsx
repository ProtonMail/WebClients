// Copy pasted from packages/components/containers/offers/components/anniversary2025/Anniversary2025Pricing.tsx
// to avoid unnecessarily increasing bundle size
import { c, msgid } from 'ttag';

import Price from '@proton/components/components/price/Price';
import type { OfferProps } from '@proton/components/containers/offers/interface';
import type { CYCLE } from '@proton/payments/core/constants';

const getDealMonthDurationText = (cycle: CYCLE | undefined) => {
    const n = Number(cycle);

    if (n === 12) {
        return c('anniversary_2025: Offers').t`12 months`;
    }

    if (n === 24) {
        return c('anniversary_2025: Offers').t`24 months`;
    }

    if (n === 15) {
        return c('anniversary_2025: Offers').t`15 months`;
    }

    if (n === 30) {
        return c('anniversary_2025: Offers').t`30 months`;
    }

    return c('anniversary_2025: Offers').ngettext(msgid`${n} month`, `${n} months`, n);
};

export const Anniversary2025Pricing = (props: OfferProps) => {
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

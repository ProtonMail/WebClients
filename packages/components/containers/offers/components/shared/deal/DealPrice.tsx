import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import clsx from '@proton/utils/clsx';

import { useDealContext } from '../deal/DealContext';

const DealPrice = () => {
    const {
        deal: { prices, cycle, dealSuffixPrice, suffixOnNewLine },
        currency,
    } = useDealContext();
    const { withCoupon = 0, withoutCouponMonthly = 0 } = prices || {};

    const dealSuffixPriceString = dealSuffixPrice?.();

    return (
        <div className="my-4 text-center offer-monthly-price-container">
            <Price
                currency={currency}
                className={clsx(
                    'offer-monthly-price color-norm',
                    suffixOnNewLine && 'offer-monthly-price--suffix-new-line'
                )}
                suffix={dealSuffixPriceString ? dealSuffixPriceString : c('specialoffer: Offers').t`/ month`}
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

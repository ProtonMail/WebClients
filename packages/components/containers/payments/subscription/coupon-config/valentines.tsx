import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { COUPON_CODES, CYCLE } from '@proton/payments';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getPlanFromIDs } from '@proton/shared/lib/helpers/planIDs';

import { getShortBillingText } from '../helpers';
import { type CouponConfig, type CouponConfigRequiredProps } from './interface';

import './valentines.scss';

export const AmountDueMessage = (config: CouponConfigRequiredProps) => {
    const { discountPerCycle, planTitle, currency, discountPercent } = getCheckout(config);
    if (!planTitle) {
        return null;
    }

    const price = <Price currency={currency}>{discountPerCycle}</Price>;

    const line1 = c('Valentine_2025').jt`🎁 Your free gift to share, valued at ${price}\uFEFF: `;

    const discountPercentAbsolute = Math.abs(discountPercent);
    const line2 = (
        <b>{c('Valentine_2025').t`A gift code for ${discountPercentAbsolute}% off ${planTitle} for 1 year`}</b>
    );

    return (
        <span className="valentines-coupon-text">
            <span>{line1}</span>
            <br />
            {line2}
        </span>
    );
};

export const valentinesCouponConfig: CouponConfig = {
    coupon: COUPON_CODES.LOVEPRIVACY25,
    hidden: true,
    amountDueMessage: AmountDueMessage,
    checkoutSubtitle: () => c('Valentine_2025').t`Valentine's deal`,
    cyclePriceCompare: ({ cycle, suffix }, config) => {
        if (cycle !== CYCLE.YEARLY) {
            return null;
        }

        const checkout = getCheckout(config);

        return (
            <Price className="ml-2 text-strike" currency={checkout.currency} suffix={suffix}>
                {checkout.withoutDiscountPerMonth}
            </Price>
        );
    },
    cycleTitle: ({ cycle }, config) => {
        const planTitle = getPlanFromIDs(config.planIDs, config.plansMap)?.Title;
        const billingCycle = getShortBillingText(cycle, config.planIDs);
        if (!planTitle) {
            return billingCycle;
        }

        // translator: example "Mail Plus 12 months + free gift"
        const freeGiftText = c('Valentine_2025').t`+ free gift`;

        return (
            <span>
                {planTitle} {billingCycle}
                <br />
                {freeGiftText}
            </span>
        );
    },
};

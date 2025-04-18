import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { type Currency, PLANS, type PlanIDs } from '@proton/payments/index';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export const getMailUpsellsFooterText = ({
    planIDs,
    monthlyPrice,
    currency,
}: {
    planIDs: PlanIDs;
    monthlyPrice: number;
    currency: Currency;
}) => {
    const priceLine = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {monthlyPrice}
        </Price>
    );

    if (Object.keys(planIDs).includes(PLANS.BUNDLE)) {
        return c('new_plans: Subtext')
            .jt`Unlock all ${BRAND_NAME} premium products and features for just ${priceLine}. Cancel anytime.`;
    }

    if (monthlyPrice) {
        return c('new_plans: Subtext').jt`Starting from ${priceLine}`;
    }

    return null;
};

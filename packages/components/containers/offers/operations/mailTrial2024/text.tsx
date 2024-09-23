import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

export const getCTAContent = () => {
    return c('mailtrial2024: Action').t`Get the deal`;
};

export const getExpires = () => {
    return c('mailtrial2024: Info').t`Limited-time offer, expires April 2 2024`;
};

export const getRenews = (currency: Currency) => {
    const renewablePrice = (
        <Price key="renewable-price" currency={currency} suffix={c('Suffix').t`/month`} isDisplayedInSentence>
            {499}
        </Price>
    );
    return c('mailtrial2024: Footer').jt`Renews at ${renewablePrice}, cancel anytime`;
};

const planName = PLAN_NAMES[PLANS.MAIL];

export const getTitle = (currency: Currency) => {
    const planPrice = (
        <Price key="plan-price" currency={currency} isDisplayedInSentence>
            {100}
        </Price>
    );
    return c('mailtrial2024: Title').jt`Get ${planName} for only ${planPrice}`;
};

import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import { Price } from '../../../../components/price';

export const getCTAContent = () => {
    return c('drivePlus2024: Action').t`Get the deal`;
};

export const getExpires = () => {
    return c('drivePlus2024: Info').t`Limited-time offer`;
};

export const getRenews = (currency: Currency) => {
    const renewablePrice = (
        <Price key="renewable-price" currency={currency} suffix={c('Suffix').t`/month`} isDisplayedInSentence>
            {499}
        </Price>
    );
    return c('drivePlus2024: Footer').jt`Renews at ${renewablePrice}, cancel anytime`;
};

const planName = PLAN_NAMES[PLANS.DRIVE];

export const getTitle = (currency: Currency) => {
    const planPrice = (
        <Price key="plan-price" currency={currency} isDisplayedInSentence>
            {100}
        </Price>
    );
    return c('drivePlus2024: Title').jt`Get ${planName} for only ${planPrice}`;
};

import type { ReactNode } from 'react';

import { c } from 'ttag';

import { BRAND_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

export const getTitle = () => {
    // translator: Introducing <Proton Duo>
    return c('duoplan2024: Title').jt`Introducing ${PLAN_NAMES[PLANS.DUO]} `;
};
export const getSubTitle = (isUsingMoreThan80PercentStorage: boolean) => {
    if (isUsingMoreThan80PercentStorage) {
        return c('duoplan2024: SubTitle').t`Double your storage`;
    }
    return c('duoplan2024: SubTitle').jt`All of ${BRAND_NAME}, for 2.`;
};

export const getInfosUser = () => {
    return c('duoplan2024: Info').t`2 users`;
};
export const getInfos = () => {
    return c('duoplan2024: Info').jt`Full access to all ${BRAND_NAME} products`;
};
export const getStorage = () => {
    return c('duoplan2024: Info').t`1 TB shared storage`;
};

export const getCTAContent = (price: string | ReactNode) => {
    return c('duoplan2024: Action').jt`Get it for ${price}`;
};

export const getSavedAmount = (amountSave: string | ReactNode) => {
    return c('duoplan2024: Info').jt`You save ${amountSave}`;
};

export const getRenews = (
    amountBilled: string | ReactNode,
    amountSave: string | ReactNode,
    isCycleTwoYear: boolean
) => {
    if (isCycleTwoYear) {
        return c('duoplan2024: Footer')
            .jt`Billed yearly at ${amountBilled}. Discounts are based on the standard monthly pricing.`;
    }

    return c('duoplan2024: Footer')
        .jt`Billed yearly at ${amountBilled}. Save ${amountSave} over 2 individual ${BRAND_NAME} Unlimited yearly subscriptions.`;
};

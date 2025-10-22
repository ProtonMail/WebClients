import { useMemo } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { CYCLE, DEFAULT_CURRENCY, PLANS, getPlanByName } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { featureListAdditionalUser, featureListStorageUpgrade } from './features';
import type { UnlimitedToDuoOfferConfig, UnlimitedToDuoTipProps } from './interface';
import { UnlimitedToDuoMessageType } from './interface';

const getTips = (): UnlimitedToDuoTipProps[] => [
    {
        type: UnlimitedToDuoMessageType.DoubleYourStorage,
        cta: c('Duo offer: Link').t`Double your storage`,
        spotlightTitle: c('Duo offer: Title').t`Double your storage with ${BRAND_NAME} Duo`,
        features: featureListStorageUpgrade,
    },
    {
        type: UnlimitedToDuoMessageType.ShareYourPlan,
        cta: c('Duo offer: Link').t`Share your plan`,
        spotlightTitle: c('Duo offer: Title').t`Share your plan benefits with ${BRAND_NAME} Duo`,
        features: featureListAdditionalUser,
    },
];

export const useUnlimitedToDuoConfig = (): UnlimitedToDuoOfferConfig => {
    const [user] = useUser();
    const [plansResults] = usePlans();

    const currency = user?.Currency || DEFAULT_CURRENCY;
    const duoPlan = getPlanByName(plansResults?.plans ?? [], PLANS.DUO, currency);
    const price = (duoPlan?.Pricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const tips = useMemo(() => getTips(), []);

    const currentMonthIndex = new Date().getMonth() + 1;
    const monthlyRotatedTipIndex = currentMonthIndex % 2;
    const selectedTip = tips[monthlyRotatedTipIndex];

    return {
        type: selectedTip.type,
        title: selectedTip.spotlightTitle,
        features: selectedTip.features,
        currency,
        price,
        topButton: {
            shape: 'outline',
            title: selectedTip.cta,
            gradient: false,
            icon: 'lightbulb',
        },
        loading: false,
    };
};

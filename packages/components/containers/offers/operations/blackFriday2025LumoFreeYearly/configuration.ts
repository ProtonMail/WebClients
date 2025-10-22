import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Layout from '../../components/blackFriday/Layout';
import { getLumoPlusFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';

export const blackFriday2025LumoFreeYearlyConfig: OfferConfig = {
    ID: 'black-friday-2025-lumo-free-yearly',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2025LumoFreeYearly,
    canBeDisabled: true,
    topButton: {
        shape: 'ghost',
        variant: 'bf-2025-free',
        icon: 'gift',
        iconSize: 4,
        gradient: false,
        // translator: translate "Black Friday" only if it's problematic in your language (offensive/unknown/etc.), keep translation as short as possible, like "Black Friday Offer"
        getCTAContent: () => c('BF2025: Action (top button in header)').t`Black Friday sale`,
    },
    hideDealPriceInfos: true,
    deals: [
        {
            ref: 'proton_bf_25_lumo_free_web',
            dealName: PLAN_NAMES[PLANS.LUMO],
            planIDs: {
                [PLANS.LUMO]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2025,
            features: getLumoPlusFeatures,
        },
    ],
    layout: Layout,
};

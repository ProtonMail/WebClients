import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { IcUsersFilled } from '@proton/icons/icons/IcUsersFilled';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { UnlimitedToDuoDiscountedLayout } from '../../components/unlimitedToDuoDiscounted/UnlimitedToDuoDiscountedLayout';
import kv from '../../components/unlimitedToDuoDiscounted/try-duo-2026.png';
import type { OfferConfig } from '../../interface';

const getFeatures = () => {
    return [
        { name: c('tryduo2026: Info').t`2 TB of storage to share` },
        { name: c('tryduo2026: Info').t`2 user accounts` },
        { name: c('tryduo2026: Info').t`All premium features from your current plan` },
    ];
};

export const configuration: OfferConfig = {
    ID: 'unlimited-to-duo-discounted',
    images: { modalImage: kv },
    featureCode: FeatureCode.OfferUnlimitedToDuoDiscounted,
    canBeDisabled: true,
    darkBackground: true,
    deals: [
        {
            ref: 'offer_tryduo2026_unlimited_duo_mail_web',
            getRef: (product) => {
                return `offer_tryduo2026_unlimited_duo_${product}_web`;
            },
            dealName: PLAN_NAMES[PLANS.DUO],
            couponCode: COUPON_CODES.TRYDUO2026,
            planIDs: {
                [PLANS.DUO]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: getFeatures,
        },
    ],
    topButton: {
        getCTAContent: (discount) => {
            const planName = PLAN_NAMES[PLANS.DUO].replace(`${BRAND_NAME} `, '');
            // translator: button in the top right corner of the app, e.g. "Get 40% off Duo"
            return c('tryduo2026: Action').t`Get ${discount}% off ${planName}`;
        },
        shape: 'outline',
        icon: IcUsersFilled,
        gradient: false,
        iconGradient: false,
        variant: 'unlimited-to-duo-discounted',
    },
    layout: UnlimitedToDuoDiscountedLayout,
};

import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Anniversary2025Layout from '../../components/anniversary2025/Anniversary2025Layout';
import { type OfferConfig } from '../../interface';

export const anniversary2025PassPlus: OfferConfig = {
    ID: 'anniversary-2025-pass-plus',
    title: c('anniversary_2025: Offer').t`Save big on premium Pass features with a limited-time discount.`,
    featureCode: FeatureCode.OfferAnniversary2025PassPlus,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_bday_25_pass_plus_web',
            dealName: PLAN_NAMES[PLANS.PASS],
            couponCode: COUPON_CODES.PROTONBDAYSALEB25,
            planIDs: {
                [PLANS.PASS]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('anniversary_2025: Offer').t`Share passwords easily` },
                { name: c('anniversary_2025: Offer').t`Add unlimited credit cards` },
                {
                    name: c('anniversary_2025: Offer').t`Save time with built-in 2FA`,
                },
            ],
        },
    ],
    topButton: {
        shape: 'outline',
        getCTAContent: () => c('anniversary_2025: offer').t`Anniversary offer`,
        icon: 'gift',
        iconSize: 4,
        gradient: false,
        variant: 'anniversary-2025',
    },
    layout: Anniversary2025Layout,
};

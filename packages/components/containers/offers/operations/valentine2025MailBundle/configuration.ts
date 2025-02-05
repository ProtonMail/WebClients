import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import { type OfferConfig } from '../../interface';
import Layout from './Layout';

export const valentineMailBundle2025: OfferConfig = {
    ID: 'valentine-2025-mail-bundle',
    featureCode: FeatureCode.OfferValentine2025MailBundle,
    canBeDisabled: false,
    autoPopUp: 'one-time',
    deals: [
        {
            ref: 'vd_25_mail_plus_web',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            couponCode: COUPON_CODES.LOVEPRIVACY25,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
        },
    ],
    topButton: {
        shape: 'outline',
        getCTAContent: () => c('Valentine_2025: offer').t`Valentine's deal`,
        gradient: false,
        icon: 'gift-2',
        variant: 'valentines-day',
    },
    layout: Layout,
};

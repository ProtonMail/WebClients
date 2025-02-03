import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { COUPON_CODES } from '@proton/shared/lib/constants';

import { type OfferConfig } from '../../interface';
import Layout from './Layout';

export const valentineMail2025: OfferConfig = {
    ID: 'valentine-2025-mail-plus',
    featureCode: FeatureCode.OfferValentine2025MailPlus,
    canBeDisabled: false,
    autoPopUp: 'one-time',
    deals: [
        {
            ref: 'vd_25_mail_free_web',
            dealName: PLAN_NAMES[PLANS.MAIL],
            couponCode: COUPON_CODES.LOVEPRIVACY25,
            planIDs: {
                [PLANS.MAIL]: 1,
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

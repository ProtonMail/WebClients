import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import { type OfferConfig } from '../../interface';
import Layout from './Layout';

export const valentineDrive2025: OfferConfig = {
    ID: 'valentine-2025-drive-plus',
    featureCode: FeatureCode.OfferValentine2025DrivePlus,
    canBeDisabled: false,
    autoPopUp: 'one-time',
    deals: [
        {
            ref: 'vd_25_drive_free_web',
            dealName: PLAN_NAMES[PLANS.DRIVE],
            planIDs: {
                [PLANS.DRIVE]: 1,
            },
            couponCode: COUPON_CODES.LOVEPRIVACY25,
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

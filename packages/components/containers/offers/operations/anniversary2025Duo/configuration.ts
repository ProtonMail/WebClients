import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import Anniversary2025Layout from '../../components/anniversary2025/Anniversary2025Layout';
import { type OfferConfig } from '../../interface';

export const anniversary2025Duo: OfferConfig = {
    ID: 'anniversary-2025-duo',
    title: c('anniversary_2025: Offer').t`Here's an exclusive gift to celebrate our journey together.`,
    featureCode: FeatureCode.OfferAnniversary2025Duo,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_bday_25_duo_web',
            dealName: PLAN_NAMES[PLANS.DUO],
            couponCode: COUPON_CODES.COMMUNITYSPECIALDEAL25,
            planIDs: {
                [PLANS.DUO]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('anniversary_2025: Offer').t`Online privacy for up to 2 people` },
                {
                    name: c('anniversary_2025: Offer').t`Double your encrypted storage – get 1 TB for all your data`,
                },
                {
                    name: c('anniversary_2025: Offer')
                        .t`All premium features of ${BRAND_NAME} Mail, Pass, VPN, Drive, and Calendar`,
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

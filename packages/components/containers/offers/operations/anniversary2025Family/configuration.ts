import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import Anniversary2025Layout from '../../components/anniversary2025/Anniversary2025Layout';
import { getAnniversary2025Title } from '../../helpers/anniversary2025';
import { type OfferConfig } from '../../interface';

export const anniversary2025Family: OfferConfig = {
    ID: 'anniversary-2025-family',
    title: getAnniversary2025Title,
    featureCode: FeatureCode.OfferAnniversary2025Family,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_bday_25_family_web',
            dealName: PLAN_NAMES[PLANS.FAMILY],
            couponCode: COUPON_CODES.COMMUNITYSPECIALDEAL25,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('anniversary_2025: Offer').t`Online privacy for your whole family (up to 6 users)` },
                {
                    name: c('anniversary_2025: Offer').t`Triple your encrypted storage – get 3 TB for all your data`,
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

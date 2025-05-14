import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Anniversary2025Layout from '../../components/anniversary2025/Anniversary2025Layout';
import { getAnniversary2025Title } from '../../helpers/anniversary2025';
import { type OfferConfig } from '../../interface';

export const anniversary2025Bundle: OfferConfig = {
    ID: 'anniversary-2025-bundle',
    title: getAnniversary2025Title,
    featureCode: FeatureCode.OfferAnniversary2025Bundle,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_bday_25_bundle_web',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            couponCode: COUPON_CODES.COMMUNITYSPECIALDEAL25,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('anniversary_2025: Offer').t`500 GB encrypted storage` },
                { name: c('anniversary_2025: Offer').t`High speed streaming with VPN` },
                { name: c('anniversary_2025: Offer').t`Encrypted password manager` },
                { name: c('anniversary_2025: Offer').t`Secure email with unlimited aliases` },
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

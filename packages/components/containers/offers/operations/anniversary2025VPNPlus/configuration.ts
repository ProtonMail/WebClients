import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Anniversary2025Layout from '../../components/anniversary2025/Anniversary2025Layout';
import { type OfferConfig } from '../../interface';

export const anniversary2025VPNPlus: OfferConfig = {
    ID: 'anniversary-2025-vpn-plus',
    title: c('anniversary_2025: Offer').t`Save big on premium VPN features with a limited-time discount.`,
    featureCode: FeatureCode.OfferAnniversary2025VPNPlus,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_bday_25_vpn_plus_web',
            dealName: PLAN_NAMES[PLANS.VPN2024],
            couponCode: COUPON_CODES.PROTONBDAYSALEB25,
            planIDs: {
                [PLANS.VPN2024]: 1,
            },
            popular: 1,
            cycle: CYCLE.TWO_YEARS,
            features: () => [
                { name: c('anniversary_2025: Offer').t`Select any server` },
                { name: c('anniversary_2025: Offer').t`Stream your favorite content` },
                {
                    name: c('anniversary_2025: Offer').t`Block ads, trackers, and malware`,
                },
                {
                    name: c('anniversary_2025: Offer').t`Protect up to 10 devices`,
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

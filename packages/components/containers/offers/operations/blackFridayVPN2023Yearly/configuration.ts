import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures, getVPNFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import bannerImage from './EOY-VPN-App-Modal-996x176-60.png';
import bannerImage2x from './EOY-VPN-App-Modal-1992x352-60.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-vpn-yearly',
    autoPopUp: 'each-time',
    featureCode: FeatureCode.OfferBlackFriday2023VPNYearly,
    images: {
        bannerImage,
        bannerImage2x,
    },
    canBeDisabled: true,
    darkBackground: true,
    deals: [
        {
            ref: 'eoy_23_vpn-1y-modal-u12',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getUnlimitedVPNFeatures,
            popular: 1,
            isGuaranteed: true,
        },
        {
            ref: 'eoy_23_vpn-1y-modal-v30p',
            dealName: PLAN_NAMES[PLANS.VPN],
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.THIRTY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getVPNFeatures,
            isGuaranteed: true,
        },
    ],
    layout: Layout,
};

export default config;

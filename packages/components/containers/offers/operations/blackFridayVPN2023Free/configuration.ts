import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures, getVPNFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import bannerImage from './EOY-VPN-App-Modal-996x176-60.png';
import bannerImage2x from './EOY-VPN-App-Modal-1992x352-60.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-vpn-free',
    autoPopUp: 'each-time',
    featureCode: FeatureCode.OfferBlackFriday2023VPNFree,
    images: {
        bannerImage,
        bannerImage2x,
    },
    darkBackground: true,
    deals: [
        {
            ref: 'eoy_23_vpn-free-modal-v1p',
            dealName: PLAN_NAMES[PLANS.VPN],
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.MONTHLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getVPNFeatures,
            popular: 1,
            mobileOrder: 1,
            isGuaranteed: true,
        },
        {
            ref: 'eoy_23_vpn-free-modal-v15p',
            dealName: PLAN_NAMES[PLANS.VPN],
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.FIFTEEN,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getVPNFeatures,
            popular: 2,
            mobileOrder: 2,
            isGuaranteed: true,
        },
        {
            ref: 'eoy_23_vpn-free-modal-v30p',
            dealName: PLAN_NAMES[PLANS.VPN],
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.THIRTY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getVPNFeatures,
            popular: 3,
            mobileOrder: 3,
            isGuaranteed: true,
        },
        {
            ref: 'eoy_23_vpn-free-modal-u12',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getUnlimitedVPNFeatures,
            popular: 4,
            mobileOrder: 4,
            isGuaranteed: true,
        },
    ],
    layout: Layout,
};

export default config;

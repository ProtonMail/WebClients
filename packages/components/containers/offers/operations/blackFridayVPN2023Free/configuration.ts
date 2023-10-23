import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures, getVPNFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import bannerImage from './BF-VPN-App-Modal-996x176-60.png';
import bannerImage2x from './BF-VPN-App-Modal-1992x352-60.png';
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
            ref: 'bf_23_vpn-free-modal-v30p',
            planName: PLANS.VPN,
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.THIRTY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getVPNFeatures,
            popular: 1,
            mobileOrder: 1,
            isGuaranteed: true,
        },
        {
            ref: 'bf_23_vpn-free-modal-v15p',
            planName: PLANS.VPN,
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.FIFTEEN,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getVPNFeatures,
            popular: 3,
            mobileOrder: 2,
            isGuaranteed: true,
        },
        {
            ref: 'bf_23_vpn-free-modal-v1',
            planName: PLANS.VPN,
            planIDs: {
                [PLANS.VPN]: 1,
            },
            cycle: CYCLE.MONTHLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getVPNFeatures,
            mobileOrder: 3,
            isGuaranteed: true,
        },
        {
            ref: 'bf_23_vpn-free-modal-u12',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getUnlimitedVPNFeatures,
            popular: 2,
            mobileOrder: 4,
            isGuaranteed: true,
        },
    ],
    layout: Layout,
};

export default config;

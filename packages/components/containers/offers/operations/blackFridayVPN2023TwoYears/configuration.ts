import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import sideImage from './BF-VPN-App-Modal-400x1200-33.png';
import sideImage2x from './BF-VPN-App-Modal-800x2400-33.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-vpn-two-years',
    autoPopUp: 'each-time',
    featureCode: FeatureCode.OfferBlackFriday2023VPNTwoYears,
    images: {
        sideImage,
        sideImage2x,
    },
    canBeDisabled: true,
    deals: [
        {
            ref: 'bf_23_vpn-2y-modal-u12',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getUnlimitedVPNFeatures,
            isGuaranteed: true,
        },
    ],
    layout: Layout,
};

export default config;

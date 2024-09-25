import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getUnlimitedVPNFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import sideImage from './EOY-VPN-App-Modal-400x1200-60.png';
import sideImage2x from './EOY-VPN-App-Modal-800x2400-60.png';
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
            ref: 'eoy_23_vpn-2y-modal-u12',
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
    ],
    layout: Layout,
};

export default config;

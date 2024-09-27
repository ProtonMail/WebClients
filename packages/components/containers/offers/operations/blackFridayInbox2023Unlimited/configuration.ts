import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getVisionaryInboxFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import sideImage from './BF-Mail-App-Modal-400x1200.png';
import sideImage2x from './BF-Mail-App-Modal-800x2400.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-inbox-unlimited',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2023InboxUnlimited,
    images: {
        sideImage,
        sideImage2x,
    },
    canBeDisabled: true,
    deals: [
        {
            ref: 'eoy_23_mail_unlimited-modal-v12',
            dealName: PLAN_NAMES[PLANS.VISIONARY],
            planIDs: {
                [PLANS.VISIONARY]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getVisionaryInboxFeatures,
        },
    ],
    layout: Layout,
};

export default config;

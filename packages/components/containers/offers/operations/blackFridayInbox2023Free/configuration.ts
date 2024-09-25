import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import {
    getMailPlusInboxFeatures,
    getUnlimitedInboxFeatures,
    getVisionaryInboxFeatures,
} from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import bannerImage from './BF-Mail-App-Modal-996x176.png';
import bannerImage2x from './BF-Mail-App-Modal-1992x352.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-inbox-free',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2023InboxFree,
    images: {
        bannerImage,
        bannerImage2x,
    },
    darkBackground: true,
    deals: [
        {
            ref: 'eoy_23_mail_free-modal-m12',
            dealName: PLAN_NAMES[PLANS.MAIL],
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getMailPlusInboxFeatures,
        },
        {
            ref: 'eoy_23_mail_free-modal-u12',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getUnlimitedInboxFeatures,
            popular: 1,
        },
        {
            ref: 'eoy_23_mail_free-modal-v12',
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

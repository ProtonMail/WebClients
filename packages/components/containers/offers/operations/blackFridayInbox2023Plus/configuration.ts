import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getFamilyInboxFeatures, getUnlimitedInboxFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import bannerImage from './BF-Mail-App-Modal-996x176.png';
import bannerImage2x from './BF-Mail-App-Modal-1992x352.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-inbox-mail',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2023InboxMail,
    images: {
        bannerImage,
        bannerImage2x,
    },
    canBeDisabled: true,
    darkBackground: true,
    deals: [
        {
            ref: 'bf_23_mail_plus-modal-u12',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getUnlimitedInboxFeatures,
            popular: 1,
        },
        {
            ref: 'bf_23_mail_plus-modal-f12',
            dealName: PLAN_NAMES[PLANS.FAMILY],
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getFamilyInboxFeatures,
        },
    ],
    layout: Layout,
};

export default config;

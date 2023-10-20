import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getFamilyInboxFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
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
            ref: 'bf_23_mail_unlimited-modal-f12',
            planName: PLANS.FAMILY,
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

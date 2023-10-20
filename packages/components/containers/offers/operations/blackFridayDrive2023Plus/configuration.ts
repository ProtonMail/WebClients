import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getFamilyDriveFeatures, getUnlimitedDriveFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import bannerImage from './BF-Drive-App-Modal-996x176.png';
import bannerImage2x from './BF-Drive-App-Modal-1992x352.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-drive-plus',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2023DrivePlus,
    images: {
        bannerImage,
        bannerImage2x,
    },
    darkBackground: true,
    canBeDisabled: true,
    deals: [
        {
            ref: 'bf_23_drive_plus-modal-u12',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getUnlimitedDriveFeatures,
            popular: 1,
        },
        {
            ref: 'bf_23_drive_plus-modal-f12',
            planName: PLANS.FAMILY,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getFamilyDriveFeatures,
        },
    ],
    layout: Layout,
};

export default config;

import { FeatureCode } from '@proton/components/containers/features';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getDriveFeatures, getFamilyDriveFeatures, getUnlimitedDriveFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import bannerImage from './BF-Drive-App-Modal-996x176.png';
import bannerImage2x from './BF-Drive-App-Modal-1992x352.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-drive-free',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2023DriveFree,
    images: {
        bannerImage,
        bannerImage2x,
    },
    darkBackground: true,
    deals: [
        {
            ref: 'bf_23_drive_free-modal-d12',
            planName: PLANS.DRIVE,
            planIDs: {
                [PLANS.DRIVE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2023,
            features: getDriveFeatures,
        },
        {
            ref: 'bf_23_drive_free-modal-u12',
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
            ref: 'bf_23_drive_free-modal-f12',
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

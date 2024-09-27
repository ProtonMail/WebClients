import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getFamilyDriveFeatures, getUnlimitedDriveFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
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
            ref: 'eoy_23_drive_plus-modal-u12',
            dealName: `${PLAN_NAMES[PLANS.BUNDLE]} - 500 GB`,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getUnlimitedDriveFeatures,
            popular: 1,
        },
        {
            ref: 'eoy_23_drive_plus-modal-f12',
            dealName: `${PLAN_NAMES[PLANS.FAMILY]} - 3 TB`,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.END_OF_YEAR_2023,
            features: getFamilyDriveFeatures,
        },
    ],
    layout: Layout,
};

export default config;

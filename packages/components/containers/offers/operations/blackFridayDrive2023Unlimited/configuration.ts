import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getFamilyDriveFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import sideImage from './BF-Drive-App-Modal-400x1200.png';
import sideImage2x from './BF-Drive-App-Modal-800x2400.png';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2023-drive-unlimited',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2023DriveUnlimited,
    images: {
        sideImage,
        sideImage2x,
    },
    canBeDisabled: true,
    deals: [
        {
            ref: 'eoy_23_drive_unlimited-modal-f12',
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

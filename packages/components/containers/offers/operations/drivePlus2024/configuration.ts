import { c } from 'ttag';

import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { FeatureCode } from '../../../features';
import { getTryDrivePlus2024Features } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './drive-plus-400x1200.jpg';
import sideImage2x from './drive-plus-800x2400.jpg';
import { getCTAContent } from './text';

const config = {
    ID: 'try-drive-plus-2024',
    featureCode: FeatureCode.OfferTryDrivePlus2024DriveFree,
    autoPopUp: 'one-time',
    deals: [
        {
            ref: 'try_24_drive_free-modal-m1',
            dealName: PLAN_NAMES[PLANS.DRIVE],
            planIDs: {
                [PLANS.DRIVE]: 1,
            },
            cycle: CYCLE.MONTHLY,
            couponCode: COUPON_CODES.TRYDRIVEPLUS2024,
            features: getTryDrivePlus2024Features,
            getCTAContent,
            popular: 1, // to get solid CTA
            dealSuffixPrice: () => c('drivePlus2024: Info').t`for the first month`,
            suffixOnNewLine: true,
        },
    ],
    layout: Layout,
    hideDealTitle: true,
    hideDealPriceInfos: true,
    hideDiscountBubble: true,
    topButton: {
        gradient: false,
        iconGradient: false,
        getCTAContent: () => c('drivePlus2024: Action').t`Special Offer`,
    },
    images: {
        sideImage,
        sideImage2x,
    },
} satisfies OfferConfig;

export default config;

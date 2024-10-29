import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';

import { getDriveFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2024-drive-free',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2024DriveFree,
    topButton: {
        shape: 'ghost',
        variant: 'bf-2024',
        icon: 'percent',
        iconSize: 4,
        gradient: false,
        // translator: translate "Black Friday" only if it's problematic in your language (offensive/unknown/etc.)
        getCTAContent: () => c('BF2024: Action (top button in header)').t`Black Friday`,
    },
    hideDealPriceInfos: true,
    deals: [
        {
            ref: 'bf_24_drive_free-modal-drive_1',
            dealName: PLAN_NAMES[PLANS.DRIVE],
            planIDs: {
                [PLANS.DRIVE]: 1,
            },
            cycle: CYCLE.MONTHLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024_MONTH,
            features: getDriveFeatures,
        },
    ],
    layout: Layout,
};

export default config;

import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getUnlimitedDealFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './Unlimited-400x1200.png';
import sideImage2x from './Unlimited-800x2400.png';

const config: OfferConfig = {
    ID: 'go-unlimited-2022',
    featureCode: FeatureCode.OfferGoUnlimited2022,
    canBeDisabled: true,
    deals: [
        {
            ref: 'upsell_mail-modal-go_unlimited',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: 1,
            features: getUnlimitedDealFeatures,
            getCTAContent: () => c('specialoffer: Action, Unlimited is a plan name').t`Go Unlimited`,
        },
    ],
    layout: Layout,
    topButton: {
        shape: 'outline',
        getCTAContent: () => c('specialoffer: Action, Unlimited is a plan name').t`Go Unlimited`,
    },
    images: {
        sideImage,
        sideImage2x,
    },
};

export default config;

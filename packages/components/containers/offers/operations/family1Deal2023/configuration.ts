import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getFamilyFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './family-plan-vertical.jpg';
import sideImage2x from './family-plan-vertical@2x.jpg';

const planName = PLAN_NAMES[PLANS.FAMILY];
const config: OfferConfig = {
    ID: 'family-1-deal-2023',
    featureCode: FeatureCode.OfferFamily2023,
    getCTAContent: () => c('familyOffer_2023:Get Proton Family').t`Get ${planName}`,
    icon: 'users-plus',
    autoPopUp: 'one-time',
    deals: [
        {
            ref: 'family_offer-1-deal-24',
            planName: PLANS.FAMILY,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: true,
            features: getFamilyFeatures,
            getCTAContent: () => c('familyOffer_2023:Get Proton Family').t`Get ${planName}`,
            star: '*',
        },
    ],
    layout: Layout,
    images: {
        sideImage,
        sideImage2x,
    },
};

export default config;

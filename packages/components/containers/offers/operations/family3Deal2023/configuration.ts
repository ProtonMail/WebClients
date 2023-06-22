import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getFamilyFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import bannerImage from './family-plan-landscape.jpg';
import bannerImage2x from './family-plan-landscape@2x.jpg';

const planName = PLAN_NAMES[PLANS.FAMILY];
const config: OfferConfig = {
    ID: 'family-3-deal-2023',
    featureCode: FeatureCode.OfferFamily2023,
    getCTAContent: () => c('familyOffer_2023: Get Proton Family').t`Get ${planName}`,
    icon: 'users-plus',
    deals: [
        {
            ref: 'family_offer-3-deal-12',
            planName: PLANS.FAMILY,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.YEARLY,
            features: getFamilyFeatures,
            getCTAContent: () => c('familyOffer_2023: Get Proton Family').t`Get ${planName}`,
            star: '*',
        },
        {
            ref: 'family_offer-3-deal-24',
            planName: PLANS.FAMILY,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: true,
            features: getFamilyFeatures,
            getCTAContent: () => c('familyOffer_2023: Get Proton Family').t`Get ${planName}`,
            star: '*',
        },
        {
            ref: 'family_offer-3-deal-1',
            planName: PLANS.FAMILY,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.MONTHLY,
            features: getFamilyFeatures,
            getCTAContent: () => c('familyOffer_2023: Get Proton Family').t`Get ${planName}`,
            star: '*',
        },
    ],
    layout: Layout,
    images: {
        bannerImage,
        bannerImage2x,
    },
    darkBackground: true,
    enableCycleSelector: true,
};

export default config;

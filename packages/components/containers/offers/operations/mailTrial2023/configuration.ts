import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getMailPlusFeatures, getUnlimitedFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import bannerImage from './mail-trial-2023-landscape.png';
import bannerImage2x from './mail-trial-2023-landscape@2x.png';

const config: OfferConfig = {
    ID: 'mail-trial-2023',
    featureCode: FeatureCode.OfferMailTrial2023,
    deals: [
        {
            ref: 'plus_referral_trial-modal-m1',
            planName: PLANS.MAIL,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: false,
            features: getMailPlusFeatures,
        },
        {
            ref: 'plus_referral_trial-modal-u2',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: true,
            features: getUnlimitedFeatures,
        },
        {
            ref: 'plus_referral_trial-modal-u1',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: false,
            features: getUnlimitedFeatures,
        },
    ],
    layout: Layout,
    getCTAContent: () => c('Action').t`Upgrade`,
    shapeButton: 'outline',
    images: {
        bannerImage,
        bannerImage2x,
    },
};

export default config;

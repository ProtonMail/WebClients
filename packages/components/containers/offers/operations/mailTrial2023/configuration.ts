import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import { getMailPlusInboxFeatures, getUnlimitedFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';
import bannerImage from './upsell_mail-plus-free-trial.png';
import bannerImage2x from './upsell_mail-plus-free-trial@2x.png';

export const mailTrial2023Config: OfferConfig = {
    ID: 'mail-trial-2023',
    featureCode: FeatureCode.OfferMailTrial2023,
    deals: [
        {
            ref: 'plus_referral_trial-modal-m1',
            dealName: PLAN_NAMES[PLANS.MAIL],
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            features: getMailPlusInboxFeatures,
            getCTAContent: () => c('Action').t`Upgrade now`,
        },
        {
            ref: 'plus_referral_trial-modal-u1',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            features: getUnlimitedFeatures,
            getCTAContent: () => c('Action').t`Upgrade now`,
        },
    ],
    layout: Layout,
    topButton: {
        shape: 'outline',
        getCTAContent: () => c('Action').t`Upgrade`,
    },
    images: {
        bannerImage,
        bannerImage2x,
    },
};

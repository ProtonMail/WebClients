import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'special-offer-2022',
    ref: 'special_offer-modal-1',
    featureCode: FeatureCode.OfferSpecialOffer2022,
    canBeDisabled: true,
    deals: [
        {
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: true,
        },
    ],
    layout: Layout,
};

export default config;

import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'go-unlimited-2022',
    ref: 'go_unlimited-modal-1',
    featureCode: FeatureCode.OfferGoUnlimited2022,
    canBeDisabled: true,
    deals: [
        {
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: true,
        },
    ],
    layout: Layout,
    getCTAContent: () => c('specialoffer: Action').t`Go Unlimited`,
};

export default config;

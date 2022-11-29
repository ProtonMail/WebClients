import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'go-unlimited-2022',
    featureCode: FeatureCode.OfferGoUnlimited2022,
    canBeDisabled: true,
    deals: [
        {
            ref: 'go_unlimited-modal-1',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: true,
            header: () => c('specialoffer: Label').t`Limited time only`,
        },
    ],
    layout: Layout,
    noImg: true,
    getCTAContent: () => c('specialoffer: Action, Unlimited is a plan name').t`Go Unlimited`,
};

export default config;

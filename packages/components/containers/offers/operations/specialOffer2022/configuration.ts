import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { getUnlimitedDealFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'special-offer-2022',
    featureCode: FeatureCode.OfferSpecialOffer2022,
    canBeDisabled: true,
    deals: [
        {
            ref: 'special_offer-modal-1',
            planName: PLANS.BUNDLE,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: true,
            features: getUnlimitedDealFeatures,
        },
    ],
    layout: Layout,
    shapeButton: 'outline',
};

export default config;

import { FeatureCode } from '@proton/components/containers/features';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { getUnlimitedDealFeatures } from '../../helpers/offerCopies';
import { OfferConfig } from '../../interface';
import Layout from './Layout';
import sideImage from './SpecialOffer-400x1200.png';
import sideImage2x from './SpecialOffer-800x2400.png';

const config: OfferConfig = {
    ID: 'special-offer-2022',
    featureCode: FeatureCode.OfferSpecialOffer2022,
    canBeDisabled: true,
    deals: [
        {
            ref: 'upsell_mail-modal-special_offer23',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: 1,
            features: getUnlimitedDealFeatures,
        },
    ],
    layout: Layout,
    shapeButton: 'outline',
    images: {
        sideImage,
        sideImage2x,
    },
};

export default config;

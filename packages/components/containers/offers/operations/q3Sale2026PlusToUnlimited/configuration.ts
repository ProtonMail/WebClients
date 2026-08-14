import { CYCLE, PLANS } from '@proton/payments/core/constants';

import { Q3Sale2026Layout } from '../../components/q3Sale2026/Q3Sale2026Layout';
import type { OfferConfig } from '../../interface';
import { topButton } from '../q3Sale2026constants';
import { offers } from '../q3Sale2026offers';

const { ID, featureCode, ref, getRef, dealName, couponCode, features, title, modalImage } = offers['plus-to-unlimited'];

export const configuration: OfferConfig = {
    ID,
    title,
    images: { modalImage },
    featureCode,
    canBeDisabled: true,
    deals: [
        {
            ref,
            getRef,
            dealName,
            couponCode,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features,
        },
    ],
    topButton,
    layout: Q3Sale2026Layout,
};

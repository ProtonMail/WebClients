import { CYCLE, PLANS } from '@proton/payments/core/constants';

import { Q3Sale2026Layout } from '../../components/q3Sale2026/Q3Sale2026Layout';
import type { OfferConfig } from '../../interface';
import { getModalTitle, topButton } from '../q3Sale2026constants';
import { offers } from '../q3Sale2026offers';

const { ID, featureCode, ref, dealName, couponCode, features } = offers['family-monthly-to-yearly'];

export const configuration: OfferConfig = {
    ID,
    title: getModalTitle,
    featureCode,
    canBeDisabled: true,
    deals: [
        {
            ref,
            dealName,
            couponCode,
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features,
        },
    ],
    topButton,
    layout: Q3Sale2026Layout,
};

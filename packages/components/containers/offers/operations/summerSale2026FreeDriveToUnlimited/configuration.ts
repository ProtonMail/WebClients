import { CYCLE, PLANS } from '@proton/payments';

import { SummerSale2026Layout } from '../../components/summerSale2026/SummerSale2026Layout';
import type { OfferConfig } from '../../interface';
import { getModalTitle, topButton } from '../summerSale2026constants';
import { offers } from '../summerSale2026offers';

const { ID, featureCode, ref, dealName, couponCode, features } = offers['free-drive-to-unlimited'];

export const configuration: OfferConfig = {
    ID,
    title: getModalTitle,
    featureCode,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref,
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
    layout: SummerSale2026Layout,
};

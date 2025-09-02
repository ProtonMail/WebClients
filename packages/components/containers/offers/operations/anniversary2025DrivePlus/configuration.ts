import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';

import Anniversary2025Layout from '../../components/anniversary2025/Anniversary2025Layout';
import { getAnniversary2025Title } from '../../helpers/anniversary2025';
import type { OfferConfig } from '../../interface';

export const anniversary2025DrivePlus: OfferConfig = {
    ID: 'anniversary-2025-drive-plus',
    title: () => getAnniversary2025Title(APPS.PROTONDRIVE),
    featureCode: FeatureCode.OfferAnniversary2025DrivePlus,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_bday_25_drive_plus_web',
            dealName: PLAN_NAMES[PLANS.DRIVE],
            couponCode: COUPON_CODES.PROTONBDAYSALEB25,
            planIDs: {
                [PLANS.DRIVE]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('anniversary_2025: Offer').t`200 GB storage` },
                { name: c('anniversary_2025: Offer').t`Online document editor` },
                { name: c('anniversary_2025: Offer').t`Recover previous file versions` },
            ],
        },
    ],
    topButton: {
        shape: 'outline',
        getCTAContent: () => c('anniversary_2025: offer').t`Anniversary offer`,
        icon: 'gift',
        iconSize: 4,
        gradient: false,
        variant: 'anniversary-2025',
    },
    layout: Anniversary2025Layout,
};

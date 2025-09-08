import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { BackToSchoolLayout } from '../../components/backToSchool/BackToSchoolLayout';
import { getBackToSchoolTitle } from '../../helpers/backToSchool';
import type { OfferConfig } from '../../interface';

export const backToSchoolDrivePlus: OfferConfig = {
    ID: 'back-to-school-drive-plus',
    title: getBackToSchoolTitle,
    featureCode: FeatureCode.OfferBackToSchoolDrivePlus,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_sep_25_drive_plus_web',
            dealName: `${DRIVE_SHORT_APP_NAME} Plus`,
            couponCode: COUPON_CODES.SEP25SALE,
            planIDs: {
                [PLANS.DRIVE]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('q3campaign_2025: Info').t`200 GB storage for files, photos & docs` },
                { name: c('q3campaign_2025: Info').t`Online document editor` },
                { name: c('q3campaign_2025: Info').t`Recover previous file versions` },
            ],
        },
    ],
    topButton: {
        // TODO: appearance, variant
        shape: 'outline',
        getCTAContent: () => {
            // translator: button in the top right corner of the app (outside the modal)
            return c('q3campaign_2025: Action').t`END-OF-SUMMER SALE`;
        },
        icon: 'gift',
        iconSize: 4,
        gradient: false,
        variant: '',
    },
    layout: BackToSchoolLayout,
};

import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { APPS, DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';

import Anniversary2025Layout from '../../components/anniversary2025/Anniversary2025Layout';
import { getAnniversary2025Title } from '../../helpers/anniversary2025';
import { type OfferConfig } from '../../interface';

export const anniversary2025MailPlus: OfferConfig = {
    ID: 'anniversary-2025-mail-plus',
    title: () => getAnniversary2025Title(APPS.PROTONMAIL),
    featureCode: FeatureCode.OfferAnniversary2025MailPlus,
    autoPopUp: 'one-time',
    canBeDisabled: true,
    deals: [
        {
            ref: 'proton_bday_25_mail_plus_web',
            dealName: PLAN_NAMES[PLANS.MAIL],
            couponCode: COUPON_CODES.PROTONBDAYSALEB25,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            popular: 1,
            cycle: CYCLE.YEARLY,
            features: () => [
                { name: c('anniversary_2025: Offer').t`15 GB storage` },
                { name: c('anniversary_2025: Offer').t`Unlimited folders, labels and filters` },
                { name: DARK_WEB_MONITORING_NAME },
                { name: c('anniversary_2025: Offer').t`Use your own email domain` },
                { name: c('anniversary_2025: Offer').t`Short @pm.me address` },
            ],
        },
    ],
    topButton: {
        shape: 'outline',
        getCTAContent: () => c('anniversary_2025: offer').t`Anniversary offer`,
        gradient: false,
        icon: 'gift',
        iconSize: 4,
        variant: 'anniversary-2025',
    },
    layout: Anniversary2025Layout,
};

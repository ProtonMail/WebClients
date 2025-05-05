import { FeatureCode } from '@proton/features/interface';
import { PLANS } from '@proton/payments/index';
import { APPS } from '@proton/shared/lib/constants';
import {
    APP_UPSELL_REF_PATH,
    DRIVE_UPSELL_PATHS,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import driveOfferSpotlight from '@proton/styles/assets/img/permanent-offer/drive_offer_spotlight.svg';
import mailOfferSpotlight from '@proton/styles/assets/img/permanent-offer/mail_offer_spotlight.svg';
import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';

import type { SupportedPlans } from './helpers/interface';

export interface PaidUserConfig {
    currentPlan: SupportedPlans;
    allowedApps: Set<string>;
    offerFlag: FeatureFlag;
    offerTimestampFlag: FeatureCode;
    spotlightImage: string;
    upsellRef: string;
}

export const paidConfig: Record<SupportedPlans, PaidUserConfig> = {
    [PLANS.MAIL]: {
        currentPlan: PLANS.MAIL,
        offerFlag: 'SubscriberNudgeMailMonthly',
        allowedApps: new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]),
        offerTimestampFlag: FeatureCode.MailPaidUserNudgeTimestamp,
        spotlightImage: mailOfferSpotlight,
        upsellRef: getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: MAIL_UPSELL_PATHS.PLUS_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
        }),
    },
    [PLANS.DRIVE]: {
        currentPlan: PLANS.DRIVE,
        offerFlag: 'SubscriberNudgeDriveMonthly',
        allowedApps: new Set<string>([APPS.PROTONDRIVE]),
        offerTimestampFlag: FeatureCode.DrivePaidUserNudgeTimestamp,
        spotlightImage: driveOfferSpotlight,
        upsellRef: getUpsellRef({
            app: APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: DRIVE_UPSELL_PATHS.PLUS_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
        }),
    },
    [PLANS.BUNDLE]: {
        currentPlan: PLANS.BUNDLE,
        offerFlag: 'SubscriberNudgeBundleMonthly',
        allowedApps: new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE]),
        offerTimestampFlag: FeatureCode.BundlePaidUserNudgeTimestamp,
        spotlightImage: mailOfferSpotlight,
        upsellRef: getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: MAIL_UPSELL_PATHS.BUNDLE_MONTHLY_SUBSCRIBER_NUDGE_VARIANT_MONEY,
        }),
    },
};

import { FeatureCode } from '@proton/features/interface';
import { PLANS } from '@proton/payments/index';
import { APPS } from '@proton/shared/lib/constants';
import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';

import type { SupportedPlans } from './helpers/interface';

interface PaidUserConfig {
    currentPlan: SupportedPlans;
    allowedApps: Set<string>;
    offerFlag: FeatureFlag;
    offerTimestampFlag: FeatureCode;
}

export const paidConfig: Record<SupportedPlans, PaidUserConfig> = {
    [PLANS.MAIL]: {
        currentPlan: PLANS.MAIL,
        offerFlag: 'SubscriberNudgeMailMonthly',
        allowedApps: new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]),
        offerTimestampFlag: FeatureCode.MailPaidUserNudgeTimestamp,
    },
    [PLANS.DRIVE]: {
        currentPlan: PLANS.DRIVE,
        offerFlag: 'SubscriberNudgeDriveMonthly',
        allowedApps: new Set<string>([APPS.PROTONDRIVE]),
        offerTimestampFlag: FeatureCode.DrivePaidUserNudgeTimestamp,
    },
    [PLANS.BUNDLE]: {
        currentPlan: PLANS.BUNDLE,
        offerFlag: 'SubscriberNudgeBundleMonthly',
        allowedApps: new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE]),
        offerTimestampFlag: FeatureCode.BundlePaidUserNudgeTimestamp,
    },
};

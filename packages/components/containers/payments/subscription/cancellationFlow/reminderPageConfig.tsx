import { PLANS } from '@proton/shared/lib/constants';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import type { SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';

import { getBundleConfig } from './config/bundle';
import { getBundleProConfig } from './config/bundlePro';
import { getDrivePlusConfig } from './config/drivePlus';
import { getDuoConfig } from './config/duo';
import { getFamilyConfig } from './config/family';
import { getMailBusinessConfig } from './config/mailBusiness';
import { getMailEssentialConfig } from './config/mailEssential';
import { getMailPlusConfig } from './config/mailPlus';
import { getVisionaryConfig } from './config/visionary';
import type { PlanConfig } from './interface';

export const getReminderPageConfig = ({
    subscription,
    vpnCountries,
    user,
}: {
    subscription?: SubscriptionModel;
    vpnCountries?: number | null;
    user: UserModel;
}): PlanConfig | null => {
    const plan = getPlan(subscription);

    if (!plan || !subscription) {
        return null;
    }

    const vpnCountriesCount = vpnCountries || 90;

    if (plan.Name === PLANS.MAIL) {
        return getMailPlusConfig(subscription, user, plan);
    }

    if (plan.Name === PLANS.BUNDLE) {
        return getBundleConfig(subscription, user, plan, vpnCountriesCount);
    }

    if (plan.Name === PLANS.FAMILY) {
        return getFamilyConfig(subscription, user, plan, vpnCountriesCount);
    }

    if (plan.Name === PLANS.DUO) {
        return getDuoConfig(subscription, user, plan, vpnCountriesCount);
    }

    if (plan.Name === PLANS.VISIONARY) {
        return getVisionaryConfig(subscription, user, plan, vpnCountriesCount);
    }

    if (plan.Name === PLANS.DRIVE) {
        return getDrivePlusConfig(subscription, user, plan);
    }

    if (plan.Name === PLANS.MAIL_PRO) {
        return getMailEssentialConfig(subscription, user, plan);
    }

    if (plan.Name === PLANS.MAIL_BUSINESS) {
        return getMailBusinessConfig(subscription, user, plan);
    }

    if (plan.Name === PLANS.BUNDLE_PRO_2024 || plan.Name === PLANS.BUNDLE_PRO) {
        return getBundleProConfig(subscription, user, plan);
    }

    return null;
};

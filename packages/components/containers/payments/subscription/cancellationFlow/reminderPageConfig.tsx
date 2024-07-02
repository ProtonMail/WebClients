import { PLANS } from '@proton/shared/lib/constants';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import { SubscriptionModel } from '@proton/shared/lib/interfaces';

import { getBundleConfig } from './config/bundle';
import { getBundleProConfig } from './config/bundlePro';
import { getDrivePlusConfig } from './config/drivePlus';
import { getFamilyConfig } from './config/family';
import { getMailBusinessConfig } from './config/mailBusiness';
import { getMailEssentialConfig } from './config/mailEssential';
import { getMailPlusConfig } from './config/mailPlus';
import { getVisionaryConfig } from './config/visionary';
import { PlanConfig } from './interface';

export const getReminderPageConfig = ({
    subscription,
    vpnCountries,
    newCancellationPolicy,
}: {
    subscription?: SubscriptionModel;
    vpnCountries?: number | null;
    newCancellationPolicy?: boolean;
}): PlanConfig | null => {
    const plan = getPlan(subscription);

    if (!plan || !subscription) {
        return null;
    }

    const vpnCountriesCount = vpnCountries || 90;

    if (plan.Name === PLANS.MAIL) {
        return getMailPlusConfig(subscription, plan, newCancellationPolicy);
    }

    if (plan.Name === PLANS.BUNDLE) {
        return getBundleConfig(subscription, plan, vpnCountriesCount, newCancellationPolicy);
    }

    if (plan.Name === PLANS.FAMILY) {
        return getFamilyConfig(subscription, plan, vpnCountriesCount, newCancellationPolicy);
    }

    if (plan.Name === PLANS.VISIONARY) {
        return getVisionaryConfig(subscription, plan, vpnCountriesCount, newCancellationPolicy);
    }

    if (plan.Name === PLANS.DRIVE) {
        return getDrivePlusConfig(subscription, plan, newCancellationPolicy);
    }

    if (plan.Name === PLANS.MAIL_PRO) {
        return getMailEssentialConfig(subscription, plan, newCancellationPolicy);
    }

    if (plan.Name === PLANS.MAIL_BUSINESS) {
        return getMailBusinessConfig(subscription, plan, newCancellationPolicy);
    }

    if (plan.Name === PLANS.BUNDLE_PRO_2024 || plan.Name === PLANS.BUNDLE_PRO) {
        return getBundleProConfig(subscription, plan, newCancellationPolicy);
    }

    return null;
};

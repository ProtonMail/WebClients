import { PLANS } from '@proton/shared/lib/constants';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import { SubscriptionModel } from '@proton/shared/lib/interfaces';

import { getBundleConfig } from './config/bundle';
import { getDrivePlusConfig } from './config/drivePlus';
import { getFamilyConfig } from './config/family';
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
    const planName = getPlan(subscription);
    if (!planName || !subscription) {
        return null;
    }

    const vpnCountriesCount = vpnCountries || 90;

    if (planName.Name === PLANS.MAIL) {
        return getMailPlusConfig(subscription, planName, newCancellationPolicy);
    }

    if (planName.Name === PLANS.BUNDLE) {
        return getBundleConfig(subscription, planName, vpnCountriesCount, newCancellationPolicy);
    }

    if (planName.Name === PLANS.FAMILY) {
        return getFamilyConfig(subscription, planName, vpnCountriesCount, newCancellationPolicy);
    }

    if (planName.Name === PLANS.NEW_VISIONARY) {
        return getVisionaryConfig(subscription, planName, vpnCountriesCount, newCancellationPolicy);
    }

    if (planName.Name === PLANS.DRIVE) {
        return getDrivePlusConfig(subscription, planName, newCancellationPolicy);
    }

    return null;
};

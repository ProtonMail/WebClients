import type { APP_NAMES } from '@proton/shared/lib/constants';
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
    app,
    subscription,
    user,
}: {
    app?: APP_NAMES;
    subscription?: SubscriptionModel;
    user: UserModel;
}): PlanConfig | null => {
    const plan = getPlan(subscription);

    if (!plan || !subscription) {
        return null;
    }

    if (plan.Name === PLANS.MAIL) {
        return getMailPlusConfig({ plan, subscription, user });
    }

    if (plan.Name === PLANS.BUNDLE) {
        return getBundleConfig({ app, plan, subscription, user });
    }

    if (plan.Name === PLANS.FAMILY) {
        return getFamilyConfig({ plan, subscription, user });
    }

    if (plan.Name === PLANS.DUO) {
        return getDuoConfig({ app, plan, subscription, user });
    }

    if (plan.Name === PLANS.VISIONARY) {
        return getVisionaryConfig({ app, plan, subscription, user });
    }

    if (plan.Name === PLANS.DRIVE) {
        return getDrivePlusConfig({ plan, subscription, user });
    }

    if (plan.Name === PLANS.MAIL_PRO) {
        return getMailEssentialConfig({ plan, subscription, user });
    }

    if (plan.Name === PLANS.MAIL_BUSINESS) {
        return getMailBusinessConfig({ app, plan, subscription, user });
    }

    if (plan.Name === PLANS.BUNDLE_PRO_2024 || plan.Name === PLANS.BUNDLE_PRO) {
        return getBundleProConfig({ app, plan, subscription, user });
    }

    return null;
};

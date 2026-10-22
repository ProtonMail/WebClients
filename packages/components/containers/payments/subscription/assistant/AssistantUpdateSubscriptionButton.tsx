import { c } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import { getSubscriptionSupportingAddon } from '@proton/payments/core/plan/addons';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import { APPS, APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';

import SettingsLink from '../../../../components/link/SettingsLink';

const AssistantUpdateSubscriptionButton = () => {
    const [user] = useUser();
    const [allSubscriptions = []] = useAllSubscriptions();
    const subscriptionToExtend =
        getSubscriptionSupportingAddon(allSubscriptions, ADDON_PREFIXES.SCRIBE) ?? allSubscriptions[0];
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.ACCOUNT_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_TOGGLE,
        isSettings: true,
    });

    return (
        <SettingsLink
            target="_blank"
            app={APPS.PROTONMAIL}
            path={getUpgradePath({ user, plan: getPlanName(subscriptionToExtend), target: 'checkout' }, upsellRef)}
        >{c('Link').t`Add to your subscription`}</SettingsLink>
    );
};

export default AssistantUpdateSubscriptionButton;

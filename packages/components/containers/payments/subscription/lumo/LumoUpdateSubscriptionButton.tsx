import { c } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import { getSubscriptionSupportingAddon } from '@proton/payments/core/plan/addons';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';

import SettingsLink from '../../../../components/link/SettingsLink';

const LumoUpdateSubscriptionButton = () => {
    const [user] = useUser();
    const [allSubscriptions = []] = useAllSubscriptions();
    const subscriptionToExtend =
        getSubscriptionSupportingAddon(allSubscriptions, ADDON_PREFIXES.LUMO) ?? allSubscriptions[0];

    return (
        <SettingsLink
            target="_blank"
            path={getUpgradePath({ user, plan: getPlanName(subscriptionToExtend), target: 'checkout' })}
        >
            {c('Link').t`Add to your subscription`}
        </SettingsLink>
    );
};

export default LumoUpdateSubscriptionButton;

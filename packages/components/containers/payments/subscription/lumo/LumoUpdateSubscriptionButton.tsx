import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { getUpgradePath } from '@proton/shared/lib/helpers/upsell';

const LumoUpdateSubscriptionButton = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();

    return (
        <SettingsLink target="_blank" path={getUpgradePath({ user, subscription, target: 'checkout' })}>
            {c('Link').t`Add to your subscription`}
        </SettingsLink>
    );
};

export default LumoUpdateSubscriptionButton;

import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useSubscription, useUser } from '@proton/components/hooks';
import { APPS, APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';

const AssistantUpdateSubscriptionButton = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
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
            path={addUpsellPath(getUpgradePath({ user, subscription, target: 'checkout' }), upsellRef)}
        >{c('Link').t`Add to your subscription`}</SettingsLink>
    );
};

export default AssistantUpdateSubscriptionButton;

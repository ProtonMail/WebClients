import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { MobileSelectors } from '../../../mobileSelectors';
import { isNativeMobileApp } from '../../../util/userAgent';

/**
 * "Manage Subscription" CTA for paid users in the native mobile app.
 *
 * Store subscriptions can only be managed natively, so the mobile client injects JS that
 * intercepts clicks on `manageSubscriptionTrigger` — the same mechanism as the upgrade triggers —
 * and opens its own flow. The path is only a web fallback. Renders nothing outside the mobile app,
 * and nothing for free users, who get the upsell section instead.
 */
const MobileManageSubscriptionButton = () => {
    const { isLumoPaid } = useLumoPlan();

    if (!isNativeMobileApp() || !isLumoPaid) {
        return null;
    }

    return (
        <ButtonLike
            as={SettingsLink}
            path={MobileSelectors.manageSubscriptionPath}
            shape="solid"
            color="norm"
            className={clsx(MobileSelectors.manageSubscriptionTrigger, 'mx-4')}
            style={{ '--padding-inline': 'var(--space-4)' }}
        >
            {c('collider_2025: Action').t`Manage Subscription`}
        </ButtonLike>
    );
};

export default MobileManageSubscriptionButton;

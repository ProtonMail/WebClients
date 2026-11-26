import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { MobileSelectors } from '../../../mobileSelectors';
import { getNativeAppInfo } from '../../../util/userAgent';

/**
 * "Manage Subscription" CTA for paid users in the native app that matches the store purchase.
 *
 * Store subscriptions can only be managed natively, so the mobile client injects JS that
 * intercepts clicks on `manageSubscriptionTrigger` — the same mechanism as the upgrade triggers —
 * and opens its own flow. The path is only a web fallback.
 */
const MobileManageSubscriptionButton = ({ platform }: { platform: SubscriptionPlatform }) => {
    const { isLumoPaid } = useLumoPlan();
    const nativePlatform = getNativeAppInfo()?.platform;
    const matchesStore =
        (platform === SubscriptionPlatform.iOS && nativePlatform === 'ios') ||
        (platform === SubscriptionPlatform.Android && nativePlatform === 'android');

    if (!matchesStore || !isLumoPaid) {
        return null;
    }

    return (
        <ButtonLike
            as={SettingsLink}
            path={MobileSelectors.manageSubscriptionPath}
            shape="solid"
            color="norm"
            className={MobileSelectors.manageSubscriptionTrigger}
        >
            {c('collider_2025: Action').t`Manage Subscription`}
        </ButtonLike>
    );
};

export default MobileManageSubscriptionButton;

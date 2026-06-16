import { useLocation } from 'react-router-dom';

import { useAccountSessions } from '@proton/account/accountSessions';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useTrialOnlyPaymentMethods } from '@proton/components/hooks/useTrialOnlyPaymentMethods';
import { getSubscriptionPlanTitles, isTrial } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import { type APP_NAMES, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import isTruthy from '@proton/utils/isTruthy';

import type { UserDropdownValue } from './UserDropdownContext';
import { useReferral } from './useReferral';

export const useUserDropdownInfo = ({ app }: { app: APP_NAMES }) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const location = useLocation();
    const referral = useReferral(location);
    const accountSessions = useAccountSessions();
    const hasTrialPaymentMethods = useTrialOnlyPaymentMethods();

    const upgradePathname = getUpgradePath({ user, subscription, app: APP_NAME });
    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.USER_DROPDOWN,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });

    const upgradeUrl = addUpsellPath(upgradePathname, upsellRef);
    const displayUpgradeButton =
        (user.isFree || (isTrial(subscription) && !hasTrialPaymentMethods)) &&
        !isB2BTrial &&
        !location.pathname.endsWith(upgradePathname) &&
        !user.hasPassLifetime;

    // nameToDisplay can be falsy for external account
    const nameToDisplay = user.DisplayName || user.Name || '';
    const info: UserDropdownValue['info'] = {
        planNames: user.isMember
            ? []
            : getSubscriptionPlanTitles(user, subscription)
                  .map((it) => it.planTitle)
                  .filter(isTruthy),
        name: nameToDisplay,
        email: user.Email,
        // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.
        initials: getInitials(nameToDisplay || user.Email || ''),
        organizationName: organization?.Name || '',
    };

    return {
        APP_NAME,
        user,
        info,
        upgrade: {
            display: displayUpgradeButton,
            url: upgradeUrl,
        },
        referral,
        accountSessions,
    };
};

import { useOrganization } from '@proton/account/organization/hooks';
import { useIsDataRecoveryAvailable } from '@proton/account/recovery/dataRecovery';
import { useIsSessionRecoveryAvailable } from '@proton/account/recovery/sessionRecoveryHooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import useRecoveryNotification from '@proton/components/hooks/useRecoveryNotification';
import { useConfig } from '@proton/components/index';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { applyPrefix } from '@proton/nav/api/applyPrefix';
import { defineSearchOptions } from '@proton/nav/api/defineSearchOptions';
import { defineSidebar } from '@proton/nav/api/defineSidebar';
import type { NavResolved } from '@proton/nav/types/nav';
import type { SidebarTree } from '@proton/nav/types/sidebar';
import { removeItem } from '@proton/shared/lib/helpers/storage';
import { useFlag } from '@proton/unleash/useFlag';

import { constants } from '../../constants';
import { resolveNavigation } from '../definitions/routes';
import { isB2BAdmin } from '../functions/isB2BAdmin';

type Args = {
    prefix?: string;
};

export const useB2BAdminSidebarFeature = ({
    prefix,
}: Args):
    | {
          enabled: true;
          nav: NavResolved;
          routes: SidebarTree;
          settings: ReturnType<typeof defineSearchOptions>;
          loading: false;
      }
    | { enabled: false; routes: undefined; loading: boolean } => {
    const [user, isUserLoading] = useUser();
    const [subscription, isSubscriptionLoading] = useSubscription();
    const [organization, isOrganizationLoading] = useOrganization();

    const [{ permissions }] = useUserPermissions();

    const skip = isUserLoading || isSubscriptionLoading || isOrganizationLoading || permissions === null;
    const isEnabled = useFlag('B2BSidebarRefreshEnabled');
    const { APP_NAME } = useConfig();
    const isAdmin = isB2BAdmin({ user, organization, subscription });
    const recoveryNotification = useRecoveryNotification(false, false);
    const [{ isDataRecoveryAvailable }] = useIsDataRecoveryAvailable();
    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();

    const SsoForPbs = useFlag('SsoForPbs');

    const ZoomIntegrationDisabled = useFlag('ZoomIntegrationDisabled');
    const NewScheduleOption = useFlag('NewScheduleOption');
    const B2BAlwaysOnEnabled = useFlag('B2BAlwaysOnEnabled');
    const SharedServerFeature = useFlag('SharedServerFeature');

    useEffectOnce(() => {
        removeItem(constants.AdminSidebarStorageKey);
        removeItem(constants.AdminSidebarFeedbackKey);
        removeItem(constants.AdminSidebarSpotlightKey);
    }, []);

    const disabled = (loading: boolean) => ({ enabled: false as const, routes: undefined, loading });

    if (skip || !subscription || !organization || !permissions) {
        return disabled(true);
    }
    if (!isEnabled || !isAdmin) {
        return disabled(false);
    }

    const resolvedNavigation = resolveNavigation({
        user,
        subscription,
        organization,
        notifications: { recovery: recoveryNotification?.color },
        flags: {
            SsoForPbs,
            ZoomIntegrationDisabled,
            NewScheduleOption,
            B2BAlwaysOnEnabled,
            SharedServerFeature,
        },
        context: { isDataRecoveryAvailable, isSessionRecoveryAvailable, appName: APP_NAME, isAdmin },
        permissions,
    });

    const prefixedNavigation = prefix ? applyPrefix(resolvedNavigation, prefix) : resolvedNavigation;
    return {
        enabled: true,
        loading: false,
        nav: prefixedNavigation,
        routes: defineSidebar(prefixedNavigation),
        settings: defineSearchOptions(prefixedNavigation),
    };
};

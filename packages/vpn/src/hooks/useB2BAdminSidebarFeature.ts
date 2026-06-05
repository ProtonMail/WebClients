import type { RefObject } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useIsDataRecoveryAvailable } from '@proton/account/recovery/dataRecovery';
import { useIsSessionRecoveryAvailable } from '@proton/account/recovery/sessionRecoveryHooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useOrgPermissions } from '@proton/account/userPermissions/hooks';
import { useVisibilityTracker } from '@proton/components/components/visibility/useVisibilityTracker';
import { useDeclarativeLocalState } from '@proton/components/hooks/useDeclarativeLocalState';
import useLocalState from '@proton/components/hooks/useLocalState';
import useRecoveryNotification from '@proton/components/hooks/useRecoveryNotification';
import { useConfig } from '@proton/components/index';
import { applyPrefix } from '@proton/nav/api/applyPrefix';
import { defineSearchOptions } from '@proton/nav/api/defineSearchOptions';
import { defineSidebar } from '@proton/nav/api/defineSidebar';
import type { SidebarTree } from '@proton/nav/types/sidebar';
import { telemetry } from '@proton/shared/lib/telemetry';
import { useFlag } from '@proton/unleash/useFlag';

import { constants } from '../../constants';
import { resolveNavigation } from '../definitions/routes';
import { isB2BAdmin } from '../functions/isB2BAdmin';

const off = false;
const on = true;

const useSidebarState = () => {
    const [status, setState] = useLocalState<boolean>(on, constants.AdminSidebarStorageKey);

    const toggle = () => setState((previous) => !previous);
    return { status, toggle };
};

const useKillableFeature = (key: string) => {
    const [isOn, setState] = useDeclarativeLocalState<boolean>(key);

    const setOff = () => setState(off);
    return { isOn: isOn !== off, setOff };
};

type Args = {
    prefix?: string;
    navigationRef: RefObject<HTMLDivElement>;
};

export const useB2BAdminSidebarFeature = ({
    prefix,
    navigationRef,
}: Args):
    | {
          enabled: true;
          routes: SidebarTree;
          settings: ReturnType<typeof defineSearchOptions>;
          sidebar: ReturnType<typeof useSidebarState>;
          spotlight: ReturnType<typeof useKillableFeature>;
          loading: false;
      }
    | { enabled: false; routes: undefined; loading: boolean } => {
    const [user, isUserLoading] = useUser();
    const [subscription, isSubscriptionLoading] = useSubscription();
    const [organization, isOrganizationLoading] = useOrganization();

    const skip = isUserLoading || isSubscriptionLoading || isOrganizationLoading;
    const isEnabled = useFlag('B2BSidebarRefreshEnabled');
    const { APP_NAME } = useConfig();
    const isAdmin = isB2BAdmin({ user, organization, subscription });
    const recoveryNotification = useRecoveryNotification(false, false);
    const [{ isDataRecoveryAvailable }] = useIsDataRecoveryAvailable();
    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const [permissions] = useOrgPermissions();

    const sidebarFeature = useSidebarState();
    const spotlightFeature = useKillableFeature(constants.AdminSidebarSpotlightKey);

    const B2BLogsVPN = useFlag('B2BLogsVPN');
    const SsoForPbs = useFlag('SsoForPbs');

    const ZoomIntegrationDisabled = useFlag('ZoomIntegrationDisabled');
    const NewScheduleOption = useFlag('NewScheduleOption');

    useVisibilityTracker(navigationRef, {
        onEnter: () => {
            if (!skip && isEnabled && isAdmin) {
                const trackingData = {
                    user: user.ID,
                    ...(organization ? { organization: organization.ID } : undefined),
                    isEnabled: true,
                    isActive: isEnabled && sidebarFeature.status,
                };

                telemetry.sendCustomEvent('b2b-admin-sidebar-viewed', trackingData);
            }
        },
        once: true,
    });

    const disabled = (loading: boolean) => ({ enabled: false as const, routes: undefined, loading });

    if (skip || !subscription || !organization) {
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
            B2BLogsVPN,
            SsoForPbs,
            ZoomIntegrationDisabled,
            NewScheduleOption,
        },
        context: { isDataRecoveryAvailable, isSessionRecoveryAvailable, appName: APP_NAME },
        permissions: permissions ?? {},
    });

    const prefixedNavigation = prefix ? applyPrefix(resolvedNavigation, prefix) : resolvedNavigation;
    return {
        enabled: true,
        loading: false,
        routes: defineSidebar(prefixedNavigation),
        settings: defineSearchOptions(prefixedNavigation),
        sidebar: sidebarFeature,
        spotlight: spotlightFeature,
    };
};

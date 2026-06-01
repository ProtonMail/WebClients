import { useIsDataRecoveryAvailable } from '@proton/account/recovery/dataRecovery';
import { useIsSessionRecoveryAvailable } from '@proton/account/recovery/sessionRecoveryHooks';
import { useOrgPermissions } from '@proton/account/userPermissions/hooks';
import { useDeclarativeLocalState, useLocalState, useRecoveryNotification } from '@proton/components/index';
import { defineSearchOptions } from '@proton/nav/api/defineSearchOptions';
import type { NavResolved } from '@proton/nav/types/nav';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import { constants } from '../../constants';
import { getRoutes } from '../definitions/routes';
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
    user: UserModel;
    subscription: MaybeFreeSubscription;
    organization?: OrganizationExtended;
};

export const useB2BAdminSidebarFeature = ({
    user,
    subscription,
    organization,
}: Args):
    | {
          enabled: true;
          routes: NavResolved;
          settings: ReturnType<typeof defineSearchOptions>;
          sidebar: ReturnType<typeof useSidebarState>;
          spotlight: ReturnType<typeof useKillableFeature>;
          loading: false;
      }
    | { enabled: false; routes: undefined; loading: boolean } => {
    const isEnabled = useFlag('B2BSidebarRefreshEnabled');
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

    if (!subscription || !organization) {
        return {
            loading: true,
            enabled: false,
            routes: undefined,
        };
    }

    if (isEnabled && isAdmin) {
        const routes = getRoutes({
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
            context: { isDataRecoveryAvailable, isSessionRecoveryAvailable },
            permissions: permissions ?? {},
        });

        const settings = defineSearchOptions(routes);
        return {
            enabled: true,
            loading: false,
            routes,
            settings,
            sidebar: sidebarFeature,
            spotlight: spotlightFeature,
        };
    }

    return { enabled: false, routes: undefined, loading: false };
};

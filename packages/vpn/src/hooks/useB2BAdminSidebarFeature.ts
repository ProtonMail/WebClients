import { useDeclarativeLocalState, useLocalState, useRecoveryNotification } from '@proton/components/index';
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
          sidebar: ReturnType<typeof useSidebarState>;
          feedback: ReturnType<typeof useKillableFeature>;
          spotlight: ReturnType<typeof useKillableFeature>;
      }
    | { enabled: false; routes: undefined } => {
    const isEnabled = useFlag('B2BSidebarRefreshEnabled');
    const isAdmin = isB2BAdmin({ user, organization, subscription });
    const recoveryNotification = useRecoveryNotification(false, false);

    const sidebarFeature = useSidebarState();
    const feedbackFeature = useKillableFeature(constants.AdminSidebarFeedbackKey);
    const spotlightFeature = useKillableFeature(constants.AdminSidebarSpotlightKey);

    const B2BLogsVPN = useFlag('B2BLogsVPN');
    const SsoForPbs = useFlag('SsoForPbs');

    if (isEnabled && isAdmin) {
        return {
            enabled: true,
            routes: getRoutes({
                user,
                subscription,
                organization,
                notifications: { recovery: recoveryNotification?.color },
                flags: {
                    B2BLogsVPN,
                    SsoForPbs,
                },
            }),
            sidebar: sidebarFeature,
            feedback: feedbackFeature,
            spotlight: spotlightFeature,
        };
    }

    return { enabled: false, routes: undefined };
};

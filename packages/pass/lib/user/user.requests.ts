import { api } from '@proton/pass/lib/api/api';
import type {
    AddressState,
    FeatureFlagState,
    UserAccessState,
    UserSettingsState,
    UserState,
} from '@proton/pass/store/reducers';
import { selectUserState } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { RequiredNonNull } from '@proton/pass/types';
import type { FeatureFlagsResponse } from '@proton/pass/types/api/features';
import { PassFeaturesValues } from '@proton/pass/types/api/features';
import { logger } from '@proton/pass/utils/logger';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getSettings } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { User } from '@proton/shared/lib/interfaces/User';

export const getFeatureFlags = async (): Promise<FeatureFlagState> => {
    logger.info(`[Saga::UserFeatures] syncing user feature flags`);
    const { toggles } = await api<FeatureFlagsResponse>({ url: `feature/v2/frontend`, method: 'get' });

    return PassFeaturesValues.reduce<FeatureFlagState>((features, feat) => {
        features[feat] = toggles.some((toggle) => toggle.name === feat);
        return features;
    }, {});
};

export const getUserAccess = async (): Promise<RequiredNonNull<UserAccessState>> => {
    logger.info(`[Saga::UserPlan] syncing user access`);
    const { Access } = await api({ url: 'pass/v1/user/access', method: 'get' });
    return { plan: Access!.Plan, waitingNewUserInvites: Access!.WaitingNewUserInvites };
};

export const getUserSettings = async (): Promise<UserSettingsState> => {
    try {
        logger.info(`[Saga::UserSettings] syncing user settings`);
        const { Email, Telemetry } = (await api<{ UserSettings: UserSettings }>(getSettings())).UserSettings;
        return {
            Email: { Status: Email.Status },
            Telemetry: Telemetry,
        };
    } catch {
        return {};
    }
};

export const getUserData = async (state: State): Promise<RequiredNonNull<UserState>> => {
    const cached = selectUserState(state);

    const [user, eventId, features, userSettings, addresses, access] = await Promise.all([
        cached.user ?? api<{ User: User }>(getUser()).then(({ User }) => User),
        cached.eventId ?? api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID),
        cached.features ?? (await getFeatureFlags()),
        cached.userSettings ?? (await getUserSettings()) ?? {},

        Object.keys(cached.addresses).length > 0
            ? cached.addresses
            : getAllAddresses(api).then((addresses): AddressState => toMap(addresses, 'ID')),

        cached.plan && cached.waitingNewUserInvites
            ? { plan: cached.plan, waitingNewUserInvites: cached.waitingNewUserInvites }
            : await getUserAccess(),
    ]);

    return { user, ...access, addresses, eventId, features, userSettings };
};

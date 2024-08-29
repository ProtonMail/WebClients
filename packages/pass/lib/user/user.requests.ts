import { DEFAULT_PASS_FEATURES } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import type { FeatureFlagState, HydratedAccessState, HydratedUserState } from '@proton/pass/store/reducers';
import { type ApiOptions } from '@proton/pass/types';
import type { FeatureFlagsResponse } from '@proton/pass/types/api/features';
import { PassFeaturesValues } from '@proton/pass/types/api/features';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getSettings } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Address, User, UserSettings } from '@proton/shared/lib/interfaces';

export const getFeatureFlags = async (): Promise<FeatureFlagState> => {
    logger.info(`[User] syncing feature flags`);
    const { toggles } = await api<FeatureFlagsResponse>({ url: `feature/v2/frontend`, method: 'get' });

    return PassFeaturesValues.reduce<FeatureFlagState>((features, feat) => {
        features[feat] = toggles.some((toggle) => toggle.name === feat);
        return features;
    }, {});
};

export const getUserAccess = async (apiOptions: ApiOptions = {}): Promise<HydratedAccessState> => {
    logger.info(`[User] Syncing access & plan`);
    const { Access } = await api({ url: 'pass/v1/user/access', method: 'get', ...apiOptions });
    return {
        plan: Access!.Plan,
        waitingNewUserInvites: Access!.WaitingNewUserInvites,
        monitor: Access!.Monitor,
        userData: {
            defaultShareId: Access!.UserData.DefaultShareID,
            aliasSyncEnabled: Access!.UserData.AliasSyncEnabled,
            pendingAliasToSync: Access!.UserData.PendingAliasToSync,
        },
    };
};

export const getUserSettings = async (): Promise<UserSettings> => {
    logger.info(`[User] syncing settings`);
    return (await api<{ UserSettings: UserSettings }>(getSettings())).UserSettings;
};

export const getUserModel = async (): Promise<User> => api<{ User: User }>(getUser()).then(prop('User'));

export const getUserLatestEventID = async (): Promise<string> =>
    api<{ EventID: string }>(getLatestID()).then(prop('EventID'));

export type UserData = {
    access: HydratedAccessState;
    addresses: Record<string, Address>;
    eventId: string;
    features: FeatureFlagState;
    user: User;
    userSettings: UserSettings;
};

/** Resolves all necessary user data to build up the user state */
export const getUserData = async (): Promise<HydratedUserState> => {
    const [user, eventId, userSettings, addresses, access, features] = await Promise.all([
        getUserModel(),
        getUserLatestEventID(),
        getUserSettings(),
        getAllAddresses(api).then((addresses) => toMap(addresses, 'ID')),
        getUserAccess(),
        getFeatureFlags().catch(() => DEFAULT_PASS_FEATURES),
    ]);

    return {
        ...access,
        addresses,
        eventId,
        features,
        user,
        userSettings: {
            Email: { Status: userSettings.Email.Status },
            HighSecurity: userSettings.HighSecurity,
            Locale: userSettings.Locale,
            Password: { Mode: userSettings.Password.Mode },
            Telemetry: userSettings.Telemetry,
        },
    };
};

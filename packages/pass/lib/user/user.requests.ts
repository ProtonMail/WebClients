import { api } from '@proton/pass/lib/api/api';
import type {
    FeatureFlagState,
    SafeUserAccessState,
    SafeUserState,
    UserSettingsState,
} from '@proton/pass/store/reducers';
import type { FeatureFlagsResponse } from '@proton/pass/types/api/features';
import { PassFeaturesValues } from '@proton/pass/types/api/features';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getSettings } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { User, UserSettings } from '@proton/shared/lib/interfaces';

export const getFeatureFlags = async (): Promise<FeatureFlagState> => {
    logger.info(`[Saga::UserFeatures] syncing user feature flags`);
    const { toggles } = await api<FeatureFlagsResponse>({ url: `feature/v2/frontend`, method: 'get' });

    return PassFeaturesValues.reduce<FeatureFlagState>((features, feat) => {
        features[feat] = toggles.some((toggle) => toggle.name === feat);
        return features;
    }, {});
};

export const getUserAccess = async (): Promise<SafeUserAccessState> => {
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

export const getUserState = async (): Promise<SafeUserState> => {
    const [user, eventId, userSettings, addresses, access, features] = await Promise.all([
        api<{ User: User }>(getUser()).then(prop('User')),
        api<{ EventID: string }>(getLatestID()).then(prop('EventID')),
        getUserSettings(),
        getAllAddresses(api).then((addresses) => toMap(addresses, 'ID')),
        getUserAccess(),
        getFeatureFlags(),
    ]);

    return {
        ...access,
        addresses,
        eventId,
        features,
        user,
        userSettings,
    };
};

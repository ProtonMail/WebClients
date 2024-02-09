import { api } from '@proton/pass/lib/api/api';
import type { FeatureFlagState, SafeUserAccessState } from '@proton/pass/store/reducers';
import { type ApiOptions, type MaybeNull, PlanType } from '@proton/pass/types';
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
import type { Organization } from '@proton/shared/lib/interfaces/Organization';

export const getFeatureFlags = async (): Promise<FeatureFlagState> => {
    logger.info(`[User] syncing feature flags`);
    const { toggles } = await api<FeatureFlagsResponse>({ url: `feature/v2/frontend`, method: 'get' });

    return PassFeaturesValues.reduce<FeatureFlagState>((features, feat) => {
        features[feat] = toggles.some((toggle) => toggle.name === feat);
        return features;
    }, {});
};

export const getUserAccess = async (apiOptions: ApiOptions = {}): Promise<SafeUserAccessState> => {
    logger.info(`[User] Syncing access & plan`);
    const { Access } = await api({ url: 'pass/v1/user/access', method: 'get', ...apiOptions });
    return { plan: Access!.Plan, waitingNewUserInvites: Access!.WaitingNewUserInvites };
};

export const getUserSettings = async (): Promise<UserSettings> => {
    logger.info(`[User] syncing settings`);
    return (await api<{ UserSettings: UserSettings }>(getSettings())).UserSettings;
};

export const getUserOrganization = async (): Promise<MaybeNull<Organization>> => {
    try {
        logger.info(`[User] Syncing organization info`);
        return (await api<{ Organization: Organization }>({ url: 'core/v4/organizations' })).Organization;
    } catch (error) {
        return null;
    }
};

export type UserData = {
    access: SafeUserAccessState;
    addresses: Record<string, Address>;
    eventId: string;
    features: FeatureFlagState;
    user: User;
    userSettings: UserSettings;
    organization: MaybeNull<Organization>;
};

/** Resolves all necessary user data to build up the user state */
export const getUserData = async (): Promise<UserData> => {
    const [user, eventId, userSettings, addresses, access, features] = await Promise.all([
        api<{ User: User }>(getUser()).then(prop('User')),
        api<{ EventID: string }>(getLatestID()).then(prop('EventID')),
        getUserSettings(),
        getAllAddresses(api).then((addresses) => toMap(addresses, 'ID')),
        getUserAccess(),
        getFeatureFlags(),
    ]);
    const organization = access.plan?.Type === PlanType.business ? await getUserOrganization() : null;

    return {
        access,
        addresses,
        eventId,
        features,
        user,
        userSettings,
        organization,
    };
};

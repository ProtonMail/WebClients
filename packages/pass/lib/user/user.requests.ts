import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getSettings } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Address, User, UserSettings } from '@proton/shared/lib/interfaces';

import { DEFAULT_PASS_FEATURES } from '../../constants';
import type {
    FeatureFlagAndVariantState,
    FeatureFlagState,
    FeatureFlagVariants,
    HydratedAccessState,
    HydratedUserState,
} from '../../store/reducers';
import type { Maybe } from '../../types';
import type { FeatureFlagsResponse } from '../../types/api/features';
import { PassFeature, PassFeaturesValues, isAutofillModelExperimentGroup } from '../../types/api/features';
import { prop } from '../../utils/fp/lens';
import { logger } from '../../utils/logger';
import { api } from '../api/api';

export const getFeatureFlags = async (webExtensionId: Maybe<string>): Promise<FeatureFlagAndVariantState> => {
    logger.info(`[User] syncing feature flags`);

    const { toggles } = await api<FeatureFlagsResponse>({
        url: `feature/v2/frontend`,
        method: 'get',
        ...(EXTENSION_BUILD ? { params: { browserFamily: BUILD_TARGET, webExtensionId } } : {}),
    });

    const result = PassFeaturesValues.reduce<FeatureFlagAndVariantState>(
        (acc, feature) => {
            const toggle = toggles.find((toggle) => toggle.name === feature);
            acc.features[feature] = Boolean(toggle);

            if (toggle?.variant.enabled) {
                acc.variants[feature] = {
                    name: toggle.variant.name,
                    payload: toggle.variant.payload ?? null,
                };
            }

            return acc;
        },
        { features: {}, variants: {} }
    );

    if (result.features[PassFeature.PassAutofillModelExperimentGroup]) {
        const name = result.variants[PassFeature.PassAutofillModelExperimentGroup]?.name;
        if (!name || !isAutofillModelExperimentGroup(name)) {
            logger.warn(`[User] Unrecognized "PassAutofillModelExperimentGroup" variant: "${name ?? 'none'}"`);
        }
    }

    return result;
};

export const getUserAccess = async (): Promise<HydratedAccessState> => {
    logger.info(`[User] Syncing access & plan`);
    const { Access } = await api({ url: 'pass/v1/user/access', method: 'get' });

    return {
        plan: Access.Plan,
        pendingInvites: Access.PendingInvites,
        waitingNewUserInvites: Access.WaitingNewUserInvites,
        monitor: Access.Monitor ?? null,
        userData: {
            defaultShareId: Access.UserData.DefaultShareID ?? null,
            aliasSyncEnabled: Access.UserData.AliasSyncEnabled,
            pendingAliasToSync: Access.UserData.PendingAliasToSync,
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
    featureVariants: FeatureFlagVariants;
    user: User;
    userSettings: UserSettings;
};

/** Resolves all necessary user data to build up the user state */
export const getUserData = async (webExtensionId: Maybe<string>): Promise<HydratedUserState> => {
    const [user, eventId, userSettings, addresses, access, featureFlagsData] = await Promise.all([
        getUserModel(),
        getUserLatestEventID(),
        getUserSettings(),
        getAllAddresses(api).then((addresses) => toMap(addresses, 'ID')),
        getUserAccess(),
        getFeatureFlags(webExtensionId).catch(() => ({ features: DEFAULT_PASS_FEATURES, variants: {} })),
    ]);

    return {
        ...access,
        addresses,
        devices: [],
        /** Initialized as null since `getUserData` always precedes
         * the synchronization step. */
        userEventId: null,
        eventId,
        features: featureFlagsData.features,
        featureVariants: featureFlagsData.variants,
        user,
        userSettings: {
            Email: { Status: userSettings.Email.Status },
            HighSecurity: userSettings.HighSecurity,
            Locale: userSettings.Locale,
            DateFormatOptions: {
                DateFormat: userSettings.DateFormat,
                TimeFormat: userSettings.TimeFormat,
                WeekStart: userSettings.WeekStart,
            },
            News: userSettings.News,
            Password: { Mode: userSettings.Password.Mode },
            Telemetry: userSettings.Telemetry,
        },
    };
};

export const redeemCouponApi = async (Coupon: string) =>
    api({
        url: `pass/v1/user/coupon/redeem`,
        method: 'post',
        data: { Coupon },
    });

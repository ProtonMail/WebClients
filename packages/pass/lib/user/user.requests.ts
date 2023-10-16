import { api } from '@proton/pass/lib/api/api';
import type {
    AddressState,
    FeatureFlagState,
    UserPlanState,
    UserSettingsState,
    UserState,
} from '@proton/pass/store/reducers';
import { selectUserState } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { MaybeNull, RequiredNonNull } from '@proton/pass/types';
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

export const getUserPlan = async (): Promise<UserPlanState> => {
    logger.info(`[Saga::UserPlan] syncing user access plan`);
    const { Plan } = (await api({ url: 'pass/v1/user/access', method: 'get' })).Access!;
    return Plan;
};

export const getUserSettings = async (): Promise<MaybeNull<UserSettingsState>> => {
    try {
        logger.info(`[Saga::UserSettings] syncing user settings`);
        const { Email, Telemetry } = (await api<{ UserSettings: UserSettings }>(getSettings())).UserSettings;
        return {
            Email: { Status: Email.Status },
            Telemetry: Telemetry,
        };
    } catch {
        return null;
    }
};

export const getUserData = async (state: State): Promise<RequiredNonNull<UserState>> => {
    const cached = selectUserState(state);

    const [user, addresses, eventId, plan, features, userSettings] = (await Promise.all([
        /* user model */
        cached.user ?? api<{ User: User }>(getUser()).then(({ User }) => User),

        /* user addresses */
        Object.keys(cached.addresses).length > 0
            ? cached.addresses
            : getAllAddresses(api).then((addresses): AddressState => toMap(addresses, 'ID')),

        cached.eventId ?? api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID),
        cached.plan ?? (await getUserPlan()),
        cached.features ?? (await getFeatureFlags()),
        cached.userSettings ?? (await getUserSettings()),
    ])) as [User, AddressState, string, UserPlanState, FeatureFlagState, UserSettingsState];

    return { user, plan, addresses, eventId, features, userSettings };
};

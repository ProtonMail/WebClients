import { api } from '@proton/pass/lib/api/api';
import type { FeatureFlagState, SafeUserAccessState, UserSettingsState } from '@proton/pass/store/reducers';
import type { FeatureFlagsResponse } from '@proton/pass/types/api/features';
import { PassFeaturesValues } from '@proton/pass/types/api/features';
import { logger } from '@proton/pass/utils/logger';
import { getSettings } from '@proton/shared/lib/api/settings';
import type { UserSettings } from '@proton/shared/lib/interfaces';

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

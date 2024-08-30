import { differenceInDays, fromUnixTime } from 'date-fns';

import { isFreeSubscription } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { getPlanName } from '@proton/shared/lib/helpers/subscription';
import type { Subscription, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import { PROTON_DEFAULT_THEME_SETTINGS, PROTON_THEMES_MAP, ThemeModeSetting } from '@proton/shared/lib/themes/themes';

const today = new Date();
export const getHeartbeatAccountAge = (user: UserModel) => {
    const daysSinceCreation = differenceInDays(today, fromUnixTime(user.CreateTime));

    if (daysSinceCreation <= 1) {
        return 'one day';
    }

    if (daysSinceCreation <= 7) {
        return 'one week';
    }

    if (daysSinceCreation <= 30) {
        return 'one month';
    }

    if (daysSinceCreation <= 365) {
        return 'one year';
    }

    return 'more';
};

export const formatBooleanForHeartbeat = (setting: boolean | number | undefined) => {
    if (setting === undefined) {
        return 'false';
    }

    if (setting || setting === 1) {
        return 'true';
    }

    return 'false';
};

export const getThemeMode = (mode?: ThemeModeSetting) => {
    if (mode === undefined) {
        return 'light';
    }

    switch (mode) {
        case ThemeModeSetting.Auto:
            return 'auto';
        case ThemeModeSetting.Dark:
            return 'dark';
        case ThemeModeSetting.Light:
            return 'light';
    }
};

export const shouldSendHeartBeat = (settingKey: string) => {
    const lastHeartBeatTimestamp = getItem(settingKey);
    if (lastHeartBeatTimestamp) {
        return differenceInDays(new Date(), new Date(lastHeartBeatTimestamp)) >= 7;
    }

    // If no last heartbeat, send a heartbeat immediately
    return true;
};

export const saveHeartbeatTimestamp = (settingKey: string) => {
    setItem(settingKey, new Date().getTime().toString());
};

export const getDefaultDimensions = ({
    user,
    subscription,
    userSettings,
}: {
    user: UserModel;
    subscription: Subscription;
    userSettings: UserSettings;
}) => {
    const { DarkTheme, LightTheme, Mode } = userSettings.Theme || PROTON_DEFAULT_THEME_SETTINGS;

    return {
        account_age: getHeartbeatAccountAge(user),
        subscription: isFreeSubscription(subscription) ? 'free' : getPlanName(subscription),
        light_theme_name: PROTON_THEMES_MAP[LightTheme].label,
        dark_theme_name: PROTON_THEMES_MAP[DarkTheme].label,
        theme_mode: getThemeMode(Mode),
    };
};

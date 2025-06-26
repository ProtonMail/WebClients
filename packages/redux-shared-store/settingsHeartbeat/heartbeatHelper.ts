import { differenceInDays } from 'date-fns';

import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { ThemeModeSetting } from '@proton/shared/lib/themes/constants';

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

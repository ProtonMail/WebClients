import { getSettings, updateSettings } from "../store/settingsStore";
import { mainLogger } from "./log";
import { appSession } from "./session";

export function toggleAppCache({ enabled }: { enabled: boolean }) {
    const settings = getSettings();

    if (settings.appCacheEnabled !== enabled) {
        mainLogger.info("Setting app cache to", enabled);
        updateSettings({ appCacheEnabled: enabled });

        if (!enabled) {
            appSession().clearCache();
            appSession().clearCodeCaches({ urls: [] });
            appSession().clearHostResolverCache();
        }
    }
}

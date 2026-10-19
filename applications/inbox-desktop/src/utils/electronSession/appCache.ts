import { getSettings, updateSettings } from "../../store/settingsStore";
import { mainLogger } from "../log";
import { appSession } from "./partitions";

export function toggleAppCache(appCacheEnabled: boolean) {
    const settings = getSettings();
    if (settings.appCacheEnabled === appCacheEnabled) {
        return;
    }

    mainLogger.info("Setting app cache to", appCacheEnabled);
    updateSettings({ appCacheEnabled });

    if (!appCacheEnabled) {
        appSession().clearCache();
        appSession().clearCodeCaches({ urls: [] });
        appSession().clearHostResolverCache();
    }
}

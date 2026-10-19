import { session } from "electron";

import { getSettings } from "../../store/settingsStore";

export const appSession = () => {
    const cache = getSettings().appCacheEnabled ?? true;
    return session.fromPartition("persist:app", { cache });
};

export const updateSession = () => session.fromPartition("persist:update", { cache: false });

import Store from "electron-store";
import { mainLogger } from "../utils/log";

const store = new Store<{
    installInfo?: {
        source: string | null;
        reported: boolean;
    };
}>({});

export function setInstallSource(installSource: string) {
    mainLogger.info("set install source", installSource);
    store.set("installInfo", {
        source: installSource,
        reported: false,
    });
}

export function getInstallSource() {
    const installInfo = store.get("installInfo");

    if (installInfo?.reported === false) {
        mainLogger.debug("get install source", installInfo.source);
        return installInfo.source;
    }

    return null;
}

export function setInstallSourceReported() {
    const installInfo = store.get("installInfo");

    if (installInfo && installInfo.reported === false) {
        mainLogger.info("set install source as reported");
        store.set("installInfo", {
            source: installInfo.source,
            reported: true,
        });
    }
}

import Store from "electron-store";
import { mainLogger } from "../utils/log";

const store = new Store<{ installSource: string | null }>({});

export function setInstallSource(installSource: string) {
    mainLogger.info("set install source", installSource);
    store.set("installSource", installSource);
}

export function getInstallSource() {
    const installSource = store.get("installSource") ?? null;
    mainLogger.debug("get install source", installSource);
    return installSource;
}

export function clearInstallSource() {
    if (store.has("installSource")) {
        mainLogger.info("clear install source");
        store.delete("installSource");
    }
}

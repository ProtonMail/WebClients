import log from "electron-log";

export const logURL = (prefix: string, url: string) => {
    try {
        const u = new URL(url);
        log.info(`${prefix}: ${u.hostname}`);
    } catch (e) {}
};

import Logger from "electron-log";

export const logURL = (prefix: string, url: string) => {
    try {
        const u = new URL(url);
        Logger.info(`${prefix}: ${u.hostname}`);
    } catch (e) {}
};

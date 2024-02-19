import log from "electron-log";

const sessionRegex = /(?!:\/u\/)(\d+)(?!:\/)/g;
export const getSessionID = (url: string) => {
    try {
        const pathName = new URL(url).pathname;
        return pathName.match(sessionRegex)?.[0];
    } catch (error) {
        log.error("getSessionID", error);
        return false;
    }
};

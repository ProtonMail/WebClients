import { app } from "electron";
import { getAppURL } from "../store/urlStore";

export const isProdEnv = (): boolean => {
    if (app && !app.isPackaged) {
        return false;
    }

    return getAppURL().account.endsWith("proton.me");
};

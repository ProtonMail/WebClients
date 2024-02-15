import { app } from "electron";
import { getConfig } from "./config";

const config = getConfig(app.isPackaged);

export const getTrialEndURL = () => {
    return `${config.url.account}/trial-ended`;
};

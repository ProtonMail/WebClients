import { getConfig } from "../config";

const config = getConfig();

export const getTrialEndURL = () => {
    return `${config.url.account}/trial-ended`;
};

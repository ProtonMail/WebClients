import { ProtonConfig } from '../interfaces';
import { APPS_CONFIGURATION } from '../constants';

/**
 * Given an app config the prodId is fixed, so it's convenient to have
 * it as a mutable export, then set it when the app is loaded
 */
export let prodId = '';

export const setVcalProdId = (value: string) => {
    prodId = value;
};

export const getProdIdFromNameAndVersion = (id: string, version: string) =>
    `-//Proton Technologies//${id} ${version}//EN`;

export const getProdId = (config: ProtonConfig) => {
    const { APP_NAME, APP_VERSION: appVersion } = config;
    const appName = APPS_CONFIGURATION[APP_NAME].name;

    return getProdIdFromNameAndVersion(appName, appVersion);
};

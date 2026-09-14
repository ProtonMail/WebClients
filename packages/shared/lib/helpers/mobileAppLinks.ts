import { appendUrlSearchParams } from './url';

// Attribution params for store links displayed in the web apps (settings, dashboard download sections)
const WEB_APP_CAMPAIGN = 'wa_set_btn';

export const getAppStoreLink = (appStoreLink: string) =>
    appendUrlSearchParams(appStoreLink, {
        pt: '106513916',
        ct: WEB_APP_CAMPAIGN,
        mt: '8',
    });

export const getPlayStoreLink = (playStoreLink: string) =>
    appendUrlSearchParams(playStoreLink, {
        referrer: `utm_source=proton.me&utm_medium=web&utm_campaign=${WEB_APP_CAMPAIGN}`,
    });

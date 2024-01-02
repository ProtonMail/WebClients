import { c } from 'ttag';

export const getPremium = (appName1: string, appName2?: string, appName3?: string) => {
    if (!appName2 && !appName3) {
        return c('specialoffer: Deal details').t`Premium ${appName1}`;
    }
    if (!appName3) {
        return c('specialoffer: Deal details').t`Premium ${appName1} & ${appName2}`;
    }
    return c('specialoffer: Deal details').t`Premium ${appName1} & ${appName2} & ${appName3}`;
};

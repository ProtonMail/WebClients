import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

const loginJsonContext = require.context('../../pages', true, /login.json$/, 'sync');

const loginJsonKeys = loginJsonContext.keys();

const getContext = (key: string) => {
    if (loginJsonKeys.some((otherKey) => otherKey === key)) {
        return loginJsonContext(key);
    }
    return loginJsonContext('./login.json');
};

export const getLoginMeta = (toApp: APP_NAMES | undefined, app: APP_NAMES) => {
    const productName = ((app === APPS.PROTONVPN_SETTINGS ? APPS.PROTONVPN_SETTINGS : toApp) || '')
        .replace('proton-', '')
        .replace('-settings', '');

    const value = getContext(`./${productName}.login.json`);

    return {
        title: value.appTitle,
        description: value.appDescription,
    };
};

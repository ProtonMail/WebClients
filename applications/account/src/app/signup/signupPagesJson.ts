import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

import referAFriendPage from '../../pages/refer-a-friend.json';
import trialPage from '../../pages/trial.json';

const signupJsonContext = require.context('../../pages', true, /signup.json$/, 'sync');

const signupJsonKeys = signupJsonContext.keys();

const getContext = (key: string) => {
    if (signupJsonKeys.some((otherKey) => otherKey === key)) {
        return signupJsonContext(key);
    }
    return signupJsonContext('./signup.json');
};

export const getSignupMeta = (
    toApp: APP_NAMES | undefined,
    app: APP_NAMES,
    {
        isMailRefer,
        isMailTrial,
    }: {
        isMailRefer: boolean;
        isMailTrial: boolean;
    }
) => {
    if (isMailTrial) {
        return {
            title: referAFriendPage.appTitle,
            description: referAFriendPage.appDescription,
        };
    }
    if (isMailRefer) {
        return {
            title: trialPage.appTitle,
            description: trialPage.appDescription,
        };
    }
    const productName = ((app === APPS.PROTONVPN_SETTINGS ? APPS.PROTONVPN_SETTINGS : toApp) || '')
        .replace('proton-', '')
        .replace('-settings', '');
    const value = getContext(`./${productName}.signup.json`);
    return {
        title: value.appTitle,
        description: value.appDescription,
    };
};

import { APP_NAMES } from '@proton/shared/lib/constants';

import { Parameters } from '../../pages/interface';

const signupJsonContext = require.context('../../pages', true, /signup.ts$/, 'sync');

const signupJsonKeys = signupJsonContext.keys();

const getContext = (key: string): { default: () => Parameters } => {
    if (signupJsonKeys.some((otherKey) => otherKey === key)) {
        return signupJsonContext(key);
    }
    return signupJsonContext('./signup.ts');
};

export const getSignupMeta = (toApp: APP_NAMES | undefined): Parameters => {
    const productName = (toApp || '').replace('proton-', '').replace('-settings', '');
    return getContext(`./${productName}.signup.ts`).default();
};

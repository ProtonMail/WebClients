import { APP_NAMES } from '@proton/shared/lib/constants';

import { Parameters } from '../../pages/interface';

const loginJsonContext = require.context('../../pages', true, /login.ts$/, 'sync');

const loginJsonKeys = loginJsonContext.keys();

const getContext = (key: string): { default: () => Parameters } => {
    if (loginJsonKeys.some((otherKey) => otherKey === key)) {
        return loginJsonContext(key);
    }
    return loginJsonContext('./login.ts');
};
export const getLoginMeta = (toApp: APP_NAMES | undefined): Parameters => {
    const productName = (toApp || '').replace('proton-', '').replace('-settings', '');
    return getContext(`./${productName}.login.ts`).default();
};

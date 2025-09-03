import { createHooks } from '@proton/redux-utilities';

import { defaultValue, referralInfoThunk, selectReferralInfo } from './index';

const hooks = createHooks(referralInfoThunk, selectReferralInfo);

export const useReferralInfo = () => {
    const [result, loading] = hooks.useValue();
    return [result || defaultValue, loading] as const;
};

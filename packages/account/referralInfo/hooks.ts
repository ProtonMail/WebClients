import { createHooks } from '@proton/redux-utilities';

import { referralInfoDefaultValue, referralInfoThunk, selectReferralInfo } from './index';

const hooks = createHooks(referralInfoThunk, selectReferralInfo);

export const useReferralInfo = () => {
    const [result, loading] = hooks.useValue();
    return [result || referralInfoDefaultValue, loading] as const;
};

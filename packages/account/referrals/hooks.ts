import { createHooks } from '@proton/redux-utilities';

import { referralsDefaultValue, referralsThunk, selectReferrals } from './index';

const hooks = createHooks(referralsThunk, selectReferrals);

export const useReferrals = () => {
    const [result, loading] = hooks.useValue();
    return [result || referralsDefaultValue, loading] as const;
};

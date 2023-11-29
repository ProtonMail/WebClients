import { createHooks } from '@proton/redux-utilities';

import { protonDomainsThunk, selectProtonDomains } from './index';

const defaultValue = { protonDomains: [], premiumDomains: [] };

const hooks = createHooks(protonDomainsThunk, selectProtonDomains);

export const useProtonDomains = () => {
    const [result, loading] = hooks.useValue();
    return [result || defaultValue, loading] as const;
};

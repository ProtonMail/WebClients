import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import useApi from '@proton/components/hooks/useApi';

import { type AlwaysOnPolicyService, getAlwaysOnPolicyService } from '../services/alwaysOnPolicyService';

const AlwaysOnPolicyServiceContext = createContext<AlwaysOnPolicyService | undefined>(undefined);

interface AlwaysOnPolicyServiceProviderProps {
    children: ReactNode;
}

/**
 * Creates the Always-on VPN policy service once and shares it with the subtree, so every
 * consumer talks to the same instance instead of each hook building its own from `useApi`.
 */
export const AlwaysOnPolicyServiceProvider = ({ children }: AlwaysOnPolicyServiceProviderProps) => {
    const api = useApi();
    const service = useMemo(() => getAlwaysOnPolicyService(api), [api]);

    return <AlwaysOnPolicyServiceContext.Provider value={service}>{children}</AlwaysOnPolicyServiceContext.Provider>;
};

export const useAlwaysOnPolicyService = () => {
    const service = useContext(AlwaysOnPolicyServiceContext);
    if (!service) {
        throw new Error('useAlwaysOnPolicyService must be used within an AlwaysOnPolicyServiceProvider');
    }
    return service;
};

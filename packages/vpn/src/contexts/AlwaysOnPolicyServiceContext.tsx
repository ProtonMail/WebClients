import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useApi } from '@proton/app-context/useApi';

import { type AlwaysOnPolicyService, getAlwaysOnPolicyService } from '../services/alwaysOnPolicyService';

const AlwaysOnPolicyServiceContext = createContext<AlwaysOnPolicyService | undefined>(undefined);

/**
 * Windows is always supported.
 * MacOS is behind this switch.
 * VPNB2B-182 to remove this toggle
 **/
const IS_MACOS_SUPPORT_ENABLED = false;

const AlwaysOnMacOSSupportContext = createContext<boolean>(IS_MACOS_SUPPORT_ENABLED);

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

    return (
        <AlwaysOnPolicyServiceContext.Provider value={service}>
            <AlwaysOnMacOSSupportContext.Provider value={IS_MACOS_SUPPORT_ENABLED}>
                {children}
            </AlwaysOnMacOSSupportContext.Provider>
        </AlwaysOnPolicyServiceContext.Provider>
    );
};

export const useAlwaysOnPolicyService = () => {
    const service = useContext(AlwaysOnPolicyServiceContext);
    if (!service) {
        throw new Error('useAlwaysOnPolicyService must be used within an AlwaysOnPolicyServiceProvider');
    }
    return service;
};

export const useIsMacOSSupportEnabled = () => useContext(AlwaysOnMacOSSupportContext);

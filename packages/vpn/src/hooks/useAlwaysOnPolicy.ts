import { useEffect, useState } from 'react';

import { useAlwaysOnPolicyService } from '../contexts/AlwaysOnPolicyServiceContext';
import type { AlwaysOnPolicy } from '../types/AlwaysOn';

/**
 * Fetches the organization's Always-on VPN device policy through the policy service.
 *
 * `policy === null` means "never configured" (show the call-to-action); a policy means "show the
 * overview", whether or not enforcement is currently enabled.
 */
export const useAlwaysOnPolicy = () => {
    const service = useAlwaysOnPolicyService();
    const [policy, setPolicy] = useState<AlwaysOnPolicy | null>(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const result = await service.fetchPolicy();
                if (active) {
                    setPolicy(result);
                }
            } catch {
                if (active) {
                    setPolicy(null);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, [service]);

    return { policy, isLoading, setPolicy };
};

export default useAlwaysOnPolicy;
